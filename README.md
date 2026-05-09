#  Mundial 2010 — Frontend

> Cliente web para explorar documentales y series sobre el Mundial de Sudáfrica 2010.

🔗 **Repositorio del backend:** [mundial2010-backend](https://github.com/zoomjosue/mundial2010-backend)

## 🚀 Cómo correr el proyecto localmente

> **No es necesario clonar este repositorio manualmente.**
>
> El frontend se clona y levanta automáticamente al ejecutar el script de arranque del backend, para eso mejor clonar el backend: https://github.com/zoomjosue/mundial2010-backend

### Pasos

```bash
# 1. Clona el backend
git clone https://github.com/zoomjosue/mundial2010-backend.git
cd mundial2010-backend

# 2. Ejecuta el script.
#    En Linux / macOS:
chmod +x start.sh && ./start.sh

#    En Windows:
.\start.ps1
```

El script clona este repositorio de frontend automáticamente, y Docker Compose construye y levanta los tres servicios: PostgreSQL, backend y frontend.

### URLs una vez corriendo

 Servicio    URL                              

 **Frontend**   | http://localhost:3000        
 Backend API | http://localhost:8080           
 Swagger UI | http://localhost:8080/swagger    

## Challenges implementados

### API y Backend

 Challenge:
    Paginación con controles de página y límite por página
    Búsqueda en tiempo real por nombre, descripción o género
    Ordenamiento por campo y dirección (asc/desc) 
    Códigos de error del backend mostrados al usuario con toasts 

### Challenges opcionales

 Challenge:
    Exportar lista a CSV — generado desde JavaScript puro, sin librerías
    Sistema de rating — modal con estrellas (1–10), promedio, historial y eliminación
    Subida de imágenes desde el cliente

## Decisiones de diseño

- **Sin frameworks de UI**  toda la interfaz está construida con CSS custom properties y clases utilitarias propias.
- **Tema visual** paleta basada en los colores de España.
- **JavaScript modular** — app.js maneja el estado y el renderizado, api.js es la capa de datos, ui.js contiene helpers reutilizables.
- **Config dinámica** — config.js detecta si se corre en localhost o en Render para apuntar al backend correcto automáticamente.

## Reflexión técnica

**¿Usaríamos Vanilla JS + HTML/CSS de nuevo para este tipo de proyecto?**

Fue una decisión que valió la pena, construir sin React ni Vue me olbigó a entender cómo funciona el DOM, el estado manual y el fetch API de verdad, aun que quiero volver a React porfa D:.

Lo más retador fue manejar el **estado de la UI manualmente**: paginación, búsqueda con debounce, sincronización de contadores y re-renderizado del grid sin un sistema reactivo. En React esto sería mucho más fácil con useState y useEffect.

La **exportación a CSV sin librerías** fue complicado, construir el string con Blob, agregar el BOM UTF-8 para que Excel lo abra correctamente y hacer la descarga programada con un `<a>` temporal.

El **sistema de rating** fue bonito, el tener que coordinar el modal, las estrellas interactivas, el promedio en tiempo real y la actualización del card, todo con estado local y llamadas al backend.

**¿Lo repetiríamos?** 
Para proyectos pequeños y medianos, sí. Para algo más grande con cosas más complejas y muchos componentes, probablemente y definitivamente elijo React.