# Ink District · Portafolio de Juliana Palacio

Portafolio de diseño gráfico: ilustración, empaques, editorial, fotografía, branding, audiovisual, ropa y extras.

**Ver en línea:** https://julianapalaciobe-eng.github.io/portafolio/

## Cómo editarlo

1. Abre una terminal en esta carpeta y ejecuta:

   ```
   node server.mjs site
   ```

2. Entra al panel en **http://localhost:5173/admin/**. Ahí puedes agregar, editar, ordenar y borrar piezas y secciones, subir imágenes y videos, y cambiar los datos de contacto.
3. Guarda con **Guardar cambios** (o Ctrl+S) y revisa el resultado en **http://localhost:5173**.
4. Sube los cambios a GitHub para que se publiquen:

   ```
   git add -A
   git commit -m "Actualizo el portafolio"
   git push
   ```

   En uno o dos minutos la página en línea se actualiza sola.

## Cómo está organizado

| Carpeta / archivo | Qué es |
| --- | --- |
| `site/index.html`, `styles.css`, `app.js` | La página |
| `site/data/content.json` | Todo el contenido (lo edita el panel) |
| `site/assets/` | Imágenes, videos y lo que subes desde el panel (`uploads/`) |
| `site/admin/` | El panel; solo funciona en tu computador y no se publica |
| `server.mjs` | Servidor local para ver la página y usar el panel |
| `.github/workflows/pages.yml` | Publica `site/` en GitHub Pages en cada `git push` |

## Ojo con los videos

GitHub no acepta archivos de más de 100 MB. Antes de subir un video pesado, comprímelo. Por ejemplo, con ffmpeg:

```
ffmpeg -i original.mp4 -c:v libx264 -crf 25 -maxrate 4M -bufsize 8M -c:a aac -b:a 128k -movflags +faststart video-web.mp4
```
