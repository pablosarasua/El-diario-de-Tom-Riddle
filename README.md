# El diario de Tom Riddle
![image](https://github.com/pablosarasua/El-diario-de-Tom-Riddle/blob/main/img/caratula.png)
DEMO EN YOUTUBE: https://www.youtube.com/watch?v=kVYIXsIuniM

Web que emula ser el diario del antagonista principal de Harry Potter, usando HTML, CSS &amp; JS. El funcionamiento es simple: se dibuja por encima del diario usando canvas, se guarda lo dibujado, se procesa por OCR, se manda lo detectado a una API de OpenAI, y ésta responde en el mismo diario. Todo el código de canvas se lo debo a este tutorial ---> https://img.ly/blog/how-to-draw-on-an-image-with-javascript/

Para evitar usar APIs de IAs, pensé en utilizar Tesseract. Lo abandoné al tercer intento porque no servía para este proyecto. Me decanté por utilzar la API de OpenAI, ya que tenía créditos de sobra y leía muy bien lo que yo escribía con canvas. Es posible que en un futuro haga la página un poco más "divertida", por ejemplo con música de fondo, con sonidos al escribir y demás, pero de momento así ha quedado y estoy satisfecho con el resultado.


Cualquier cambio o idea, bienvenida sea. Especialmente en el prompt, siento que no es demasiado acertado y en parte es así porque mis conocimientos del universo de Harry Potter son bastante escasos. También tengo intención de sacarlo en iOS y Android, ya que considero que ahí sí tiene sentido una aplicación así, porque puedes "dibujar" de verdad en una pantalla táctil.

