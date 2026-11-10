# Flashcards

Aplicación web para crear tarjetas de estudio, repasarlas con repetición espaciada (sistema de 5 niveles) y consultar el progreso.

- **Aplicación publicada:** `PEGAR_AQUI_LA_URL_DE_RENDER`
- **Repositorio:** `PEGAR_AQUI_LA_URL_DE_GITHUB`
- **Diagrama de componentes:** [`docs/diagrama-componentes.png`](docs/diagrama-componentes.png)

## Tecnologías

Node.js, Express, JavaScript moderno (módulos `.mjs`), `fetch` con `async/await`, Bootstrap 5.3.8, `localStorage` y `sessionStorage`.

## Cómo ejecutarla en tu computador

1. Instala [Node.js](https://nodejs.org) 18 o superior.
2. Clona el repositorio y entra a la carpeta del proyecto.
3. Ejecuta `npm install`.
4. Copia `.env.example` como `.env` (puedes dejar los valores por defecto).
5. Ejecuta `npm start` y abre `http://localhost:3000`.

## Variables de entorno

| Variable | Para qué sirve |
|---|---|
| `PORT` | Puerto del servidor (Render lo asigna solo). |
| `FRONTEND_URL` | Orígenes permitidos por CORS, separados por coma. En producción, la URL pública de Render. |
| `DATA_FILE` | (Opcional) Ruta del archivo de datos, por ejemplo si se usa un disco persistente. |

El archivo `.env` real nunca se sube a GitHub (está en `.gitignore`).

## Estructura

```
server.mjs              Servidor Express (CORS, compresión, caché, errores en JSON)
cards.routes.mjs        Rutas de la API
cards.controller.mjs    Lógica de las rutas y lectura/escritura de datos
validation.mjs          Validación de lo que llega al servidor
styles.src.css          CSS legible (origen de public/css/styles.min.css)
public/                 Única carpeta que el servidor publica
  index.html            Interfaz (Bootstrap)
  css/styles.min.css    Estilos minificados
  js/app.mjs            Eventos y flujo principal
  js/ui.mjs             Dibuja la información en el DOM (textContent)
  js/cards.mjs          Reglas de repaso espaciado
  js/api.mjs            Comunicación con el servidor (fetch)
  js/storage.mjs        localStorage y sessionStorage
docs/                   Diagrama de componentes
data/cards.json         Datos de las tarjetas (se crea solo; no se sube a GitHub)
```

## API

| Método y ruta | Descripción | Respuestas |
|---|---|---|
| `GET /api/cards` | Lista las tarjetas | 200 |
| `POST /api/cards` | Crea una tarjeta | 201, 400 |
| `PUT /api/cards/:id` | Edita o registra un repaso | 200, 400, 404 |
| `DELETE /api/cards/:id` | Borra una tarjeta | 200, 404 |
| `GET /api/health` | Comprueba que el servidor está activo | 200 |

## Seguridad

- Los datos de usuario se muestran con `textContent`, nunca con `innerHTML` (evita XSS).
- El servidor valida tipo y longitud de lo que recibe, y limita el tamaño del cuerpo a 20 kB.
- CORS solo permite los orígenes de `FRONTEND_URL`.
- Solo se publica la carpeta `public/`: `.env`, datos y código del servidor no son accesibles por URL.
- Las claves y configuraciones viven en variables de entorno.

## Almacenamiento en el navegador

- `localStorage`: tema (claro/oscuro) y copia de las tarjetas, usada si el servidor no responde.
- `sessionStorage`: progreso de repasos de la visita actual.
- No se guarda información sensible. El botón «Borrar datos guardados en este navegador» (pie de página) elimina todo.

## Accesibilidad y experiencia de usuario

Etiquetas ligadas a cada campo, foco visible con teclado (incluida la tarjeta de estudio, operable con Enter o espacio), mensajes de éxito y error con texto en una región `aria-live`, estado de carga, `aria-current` en la navegación y contraste de texto de al menos 4.5:1 (colores propios medidos entre 5.1:1 y 7.6:1).

## Optimización

1. Compresión gzip de todas las respuestas (`compression`).
2. Caché del navegador para CSS y JS (`Cache-Control`), con el HTML siempre revalidado.
3. CSS minificado (`public/css/styles.min.css`).

## Informe de Lighthouse

Resultados sobre la URL publicada (completar con los puntajes reales):

| Categoría | Puntaje |
|---|---|
| Rendimiento | |
| Accesibilidad | |
| Mejores prácticas | |
| SEO | |

**Análisis:** (2 o 3 frases: qué salió bien, qué se mejoró y qué queda pendiente.)

## Despliegue en Render (un solo servicio)

1. Sube el proyecto a GitHub.
2. En Render crea un **Web Service** conectado al repositorio.
3. *Build Command:* `npm install` · *Start Command:* `npm start`.
4. En *Environment* agrega `FRONTEND_URL` con la URL pública del servicio.
5. Cada `git push` a la rama principal despliega automáticamente.

Se publica frontend y backend en un único servicio porque Express entrega la interfaz y la API desde el mismo origen: así `fetch` usa una URL relativa, no hay problemas de CORS y se despliega una sola pieza.

## Limitación conocida

Los datos se guardan en `data/cards.json`. En el plan gratuito de Render el disco se reinicia al redesplegar o reiniciar el servicio, por lo que las tarjetas pueden perderse. La solución a futuro es usar una base de datos o un disco persistente (variable `DATA_FILE`).
