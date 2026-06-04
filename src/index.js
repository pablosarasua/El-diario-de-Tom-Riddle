// Hay que tener créditos para que funcione el proyecto
const OPENAI_API_KEY = "";

// Todo el canvas es viene de esta fuente: https://img.ly/blog/how-to-draw-on-an-image-with-javascript/
// Cargamos la imagen del diario. La idea del repositorio original era que el usuario subiera su propia imagen
const image = document.createElement("img");

image.src = "img/diario.png";

image.onload = () => {
    drawOnImage(image);
};

image.onerror = () => {
    alert("ERROR: No se ha podido cargar img/diario.png");
};

let size = 6;

const colorElement = document.getElementsByName("colorRadio");
let color;
colorElement.forEach((c) => {
    if (c.checked) color = c.value;
});

colorElement.forEach((c) => {
    c.onclick = () => {
        color = c.value;
    };
});

function drawOnImage(image = null) {
    const canvasElement = document.getElementById("canvas");
    const context = canvasElement.getContext("2d");

    const drawingCanvas = document.createElement("canvas");
    const drawingContext = drawingCanvas.getContext("2d");

    const responseCanvas = document.createElement("canvas");
    const responseContext = responseCanvas.getContext("2d");

    let fadeTimeout;
    let fadeAnimation;
    let drawingOpacity = 1;

    let responseOpacity = 1;
    let responseAnimation;
    let responseTimeout;

    function getCanvasPosition(e) {
        const rect = canvasElement.getBoundingClientRect();

        const scaleX = canvasElement.width / rect.width;
        const scaleY = canvasElement.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    function renderCanvas() {
        context.clearRect(0, 0, canvasElement.width, canvasElement.height);

        if (image) {
            context.drawImage(image, 0, 0, canvasElement.width, canvasElement.height);
        }

        context.save();
        context.globalAlpha = drawingOpacity;
        context.drawImage(drawingCanvas, 0, 0);
        context.restore();

        context.save();
        context.globalAlpha = responseOpacity;
        context.drawImage(responseCanvas, 0, 0);
        context.restore();
    }

    function recortarDibujo(canvasOriginal) {
        const ctx = canvasOriginal.getContext("2d");
        const imageData = ctx.getImageData(0, 0, canvasOriginal.width, canvasOriginal.height);
        const data = imageData.data;

        let minX = canvasOriginal.width;
        let minY = canvasOriginal.height;
        let maxX = 0;
        let maxY = 0;
        let hayDibujo = false;

        for (let y = 0; y < canvasOriginal.height; y++) {
            for (let x = 0; x < canvasOriginal.width; x++) {
                const i = (y * canvasOriginal.width + x) * 4;

                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                const esTinta = a > 40 && r < 100 && g < 100 && b < 100;

                if (esTinta) {
                    hayDibujo = true;

                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                }
            }
        }

        if (!hayDibujo) {
            const vacio = document.createElement("canvas");
            vacio.width = 300;
            vacio.height = 120;

            const vacioCtx = vacio.getContext("2d");
            vacioCtx.fillStyle = "white";
            vacioCtx.fillRect(0, 0, vacio.width, vacio.height);

            return vacio;
        }

        const padding = 80;

        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(canvasOriginal.width - 1, maxX + padding);
        maxY = Math.min(canvasOriginal.height - 1, maxY + padding);

        const ancho = maxX - minX;
        const alto = maxY - minY;

        const escala = 3;

        const canvasLimpio = document.createElement("canvas");
        const ctxLimpio = canvasLimpio.getContext("2d");

        canvasLimpio.width = ancho * escala;
        canvasLimpio.height = alto * escala;

        ctxLimpio.fillStyle = "white";
        ctxLimpio.fillRect(0, 0, canvasLimpio.width, canvasLimpio.height);

        const recorteData = ctx.getImageData(minX, minY, ancho, alto);
        const recortePixels = recorteData.data;

        const limpioData = ctxLimpio.getImageData(0, 0, canvasLimpio.width, canvasLimpio.height);
        const limpioPixels = limpioData.data;

        for (let y = 0; y < alto; y++) {
            for (let x = 0; x < ancho; x++) {
                const i = (y * ancho + x) * 4;

                const r = recortePixels[i];
                const g = recortePixels[i + 1];
                const b = recortePixels[i + 2];
                const a = recortePixels[i + 3];

                const esTinta = a > 40 && r < 120 && g < 120 && b < 120;

                if (esTinta) {
                    for (let sy = 0; sy < escala; sy++) {
                        for (let sx = 0; sx < escala; sx++) {
                            const nx = x * escala + sx;
                            const ny = y * escala + sy;
                            const ni = (ny * canvasLimpio.width + nx) * 4;

                            limpioPixels[ni] = 0;
                            limpioPixels[ni + 1] = 0;
                            limpioPixels[ni + 2] = 0;
                            limpioPixels[ni + 3] = 255;
                        }
                    }
                }
            }
        }

        ctxLimpio.putImageData(limpioData, 0, 0);

        return canvasLimpio;
    }

    function extraerTextoOpenAI(datos) {
        if (datos.output_text) {
            return datos.output_text.trim();
        }

        if (datos.output && datos.output.length > 0) {
            for (const item of datos.output) {
                if (item.content && item.content.length > 0) {
                    for (const content of item.content) {
                        if (content.text) {
                            return content.text.trim();
                        }
                    }
                }
            }
        }

        return "";
    }

    function escribirTextoEnResponseCanvas(texto) {
        responseContext.clearRect(0, 0, responseCanvas.width, responseCanvas.height);

        responseContext.font = "32px Aquiline";
        responseContext.fillStyle = "rgba(20, 15, 10, 0.9)";
        responseContext.textBaseline = "top";

        const x = responseCanvas.width * 0.55;
        let y = responseCanvas.height * 0.24;
        const maxWidth = responseCanvas.width * 0.34;
        const lineHeight = 42;

        const palabras = texto.split(" ");
        let linea = "";

        for (let i = 0; i < palabras.length; i++) {
            const prueba = linea + palabras[i] + " ";
            const medida = responseContext.measureText(prueba).width;

            if (medida > maxWidth && i > 0) {
                responseContext.fillText(linea, x, y);
                linea = palabras[i] + " ";
                y += lineHeight;
            } else {
                linea = prueba;
            }
        }

        responseContext.fillText(linea, x, y);
    }

    function mostrarRespuestaEnDiario(texto) {
        clearTimeout(responseTimeout);
        cancelAnimationFrame(responseAnimation);

        responseOpacity = 1;
        responseContext.clearRect(0, 0, responseCanvas.width, responseCanvas.height);

        let index = 0;

        function escribirLetra() {
            const textoParcial = texto.substring(0, index);

            escribirTextoEnResponseCanvas(textoParcial);
            renderCanvas();

            index++;

            if (index <= texto.length) {
                responseAnimation = requestAnimationFrame(escribirLetra);
            } else {
                responseTimeout = setTimeout(() => {
                    function desaparecerRespuesta() {
                        responseOpacity -= 0.025;

                        if (responseOpacity <= 0) {
                            responseOpacity = 0;
                            responseContext.clearRect(0, 0, responseCanvas.width, responseCanvas.height);
                            renderCanvas();
                            return;
                        }

                        renderCanvas();
                        responseAnimation = requestAnimationFrame(desaparecerRespuesta);
                    }

                    desaparecerRespuesta();
                }, 4000);
            }
        }

        escribirLetra();
    }

    async function responderComoDiarioOscuro(textoUsuario) {
        const respuesta = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + OPENAI_API_KEY
            },
            body: JSON.stringify({
                model: "gpt-4.1-mini",
                input: [
                    {
                        // Si alguien quiere mejorar el prompt, adelante. El mío es bastante mediocre, la verdad. 
                        // Agradecería que lo corrigiera alguien que está más metido que yo (que no es muy difícil)
                        role: "system",
                        content:
                            "Actúa como el diario mágico oscuro de Tom Riddle. " +
                            "Habla en español. " +
                            "Bajo ningún concepto te salgas del personaje. " +
                            "Sé frío, elegante, inteligente, misterioso y ligeramente manipulador. " +
                            "Haz las respuestas más exactas relacionadas con el mundo de Harry Potter" +
                            "No digas que eres una IA. " +
                            "Escribe la primera SIEMPRE en minúscula, y al acabar la frase no escribas el punto." +
                            "No menciones OpenAI." +
                            "Responde en una frase. Recuerda que eres el diario de Tom Riddle de la segunda película de Harry Potter" +
                            "Si te dicen 'soy [nombre]', responde solo con 'hola, [nombre]. mi nombre es Tom Riddle" +
                            "Responde solo con una frase a TODO. A ser posible, corta " +
                            "Si te preguntan 'sabes algo acerca la camara de los secretos?' o similar, responde con 'Si'. Si te preguntan si les puedes decir algo al respecto, diles, 'No'"
                    },
                    {
                        role: "user",
                        content: textoUsuario
                    }
                ]
            })
        });

        const datos = await respuesta.json();

        console.log("Respuesta diario:", datos);

        if (!respuesta.ok) {
            throw new Error(JSON.stringify(datos, null, 2));
        }

        return extraerTextoOpenAI(datos);
    }

    async function detectarTextoConOpenAI(canvasParaLeer) {
        try {
            const imagenBase64 = canvasParaLeer.toDataURL("image/png");

            const respuesta = await fetch("https://api.openai.com/v1/responses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + OPENAI_API_KEY
                },
                body: JSON.stringify({
                    model: "gpt-4.1-mini",
                    input: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "input_text",
                                    text: "Lee SOLO la palabra o frase manuscrita en negro sobre fondo blanco. Devuelve SOLO el texto leído. No inventes caracteres. Si no puedes leerlo claramente, devuelve NO_DETECTADO."
                                },
                                {
                                    type: "input_image",
                                    image_url: imagenBase64
                                }
                            ]
                        }
                    ]
                })
            });

            const datos = await respuesta.json();

            console.log("Respuesta OCR:", datos);

            if (!respuesta.ok) {
                mostrarRespuestaEnDiario("algo ha fallado al leer tus palabras");
                return;
            }

            const texto = extraerTextoOpenAI(datos);

            if (!texto || texto === "NO_DETECTADO") {
                mostrarRespuestaEnDiario("no soy capaz de entenderte");
                return;
            }

            const respuestaDiario = await responderComoDiarioOscuro(texto);

            mostrarRespuestaEnDiario(respuestaDiario);
        }
        catch (error) {
            mostrarRespuestaEnDiario("no leo a sucios muggles");
            console.error(error);
        }
    }

    function startDisappearTimer() {
        clearTimeout(fadeTimeout);
        cancelAnimationFrame(fadeAnimation);

        fadeTimeout = setTimeout(() => {
            function fade() {
                drawingOpacity -= 0.025;

                if (drawingOpacity <= 0) {
                    drawingOpacity = 0;

                    const copiaCanvas = recortarDibujo(drawingCanvas);

                    drawingContext.clearRect(
                        0,
                        0,
                        drawingCanvas.width,
                        drawingCanvas.height
                    );

                    renderCanvas();

                    detectarTextoConOpenAI(copiaCanvas);

                    return;
                }

                renderCanvas();
                fadeAnimation = requestAnimationFrame(fade);
            }

            fade();
        }, 2000);
    }

    if (image) {
        const imageWidth = image.width;
        const imageHeight = image.height;

        canvasElement.width = imageWidth;
        canvasElement.height = imageHeight;

        drawingCanvas.width = imageWidth;
        drawingCanvas.height = imageHeight;

        responseCanvas.width = imageWidth;
        responseCanvas.height = imageHeight;

        context.drawImage(image, 0, 0, imageWidth, imageHeight);
    }

    const clearElement = document.getElementById("clear");
    clearElement.onclick = () => {
        clearTimeout(fadeTimeout);
        cancelAnimationFrame(fadeAnimation);
        clearTimeout(responseTimeout);
        cancelAnimationFrame(responseAnimation);

        drawingOpacity = 1;
        responseOpacity = 1;

        drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        responseContext.clearRect(0, 0, responseCanvas.width, responseCanvas.height);

        renderCanvas();
    };

    let isDrawing = false;

    canvasElement.onmousedown = (e) => {
        clearTimeout(fadeTimeout);
        cancelAnimationFrame(fadeAnimation);
        clearTimeout(responseTimeout);
        cancelAnimationFrame(responseAnimation);

        drawingOpacity = 1;
        responseOpacity = 1;

        responseContext.clearRect(0, 0, responseCanvas.width, responseCanvas.height);

        renderCanvas();

        isDrawing = true;

        drawingContext.beginPath();
        drawingContext.lineWidth = size;
        drawingContext.strokeStyle = color;
        drawingContext.lineJoin = "round";
        drawingContext.lineCap = "round";

        const pos = getCanvasPosition(e);

        drawingContext.moveTo(pos.x, pos.y);
    };

    canvasElement.onmousemove = (e) => {
        if (isDrawing) {
            const pos = getCanvasPosition(e);

            drawingContext.lineTo(pos.x, pos.y);
            drawingContext.stroke();

            renderCanvas();
        }
    };

    canvasElement.onmouseup = function () {
        isDrawing = false;
        drawingContext.closePath();

        startDisappearTimer();
    };

    canvasElement.onmouseleave = function () {
        if (isDrawing) {
            isDrawing = false;
            drawingContext.closePath();

            startDisappearTimer();
        }
    };
}