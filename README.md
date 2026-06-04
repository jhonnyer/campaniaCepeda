# Apoyo Ciudadano - Generador de Imagen PWA

Aplicación web progresiva que genera imágenes de apoyo ciudadano para la campaña de Iván Cepeda. Funciona completamente en el navegador, no almacena fotos en el servidor y puede desplegarse con Docker + Nginx.

## Características

- Subida local de fotografía
- Validación de JPG/JPEG/PNG/WEBP y tamaño máximo 10 MB
- Generación de imagen 1080x1080 con Canvas
- Mensaje personalizado, mensaje por causa o mensaje por defecto
- Vista previa en la aplicación
- Descarga en PNG
 - PWA con `manifest.json` y `service-worker.js`

## Archivos principales

- `index.html`
- `styles.css`
- `app.js`
- `manifest.json`
- `service-worker.js`
- `Dockerfile`
- `nginx.conf`

## Instrucciones de despliegue

1. Construye la imagen Docker:

```powershell
docker build -t apoyo-cepeda .
```

2. Ejecuta el contenedor:

```powershell
docker run -d -p 80:80 --name apoyo-cepeda apoyo-cepeda
```

3. Abre `http://<tu-vps>` en el navegador.

## Notas

- No se requiere backend.
- La aplicación es responsive y funciona en móviles y escritorio.
- El service worker permite cargar los activos en modo offline.
