# Preparación del despliegue para el hackatón

Revisión: 14 de octubre de 2026. Estado: preparado en código; todavía no hay una URL alojada ni se ha contratado un servicio.

## Lo que ya está preparado

- Node 24 y compilación React en una imagen Docker. La imagen excluye .env, datos, modelos, capturas y dependencias locales mediante una lista de archivos permitidos.
- Modo local por defecto: conserva el puerto y el acceso actuales.
- Modo alojado explícito: escucha en todas las interfaces, exige un origen HTTPS y credenciales de prueba. Protege páginas, APIs, exportaciones y cambios; rechaza operaciones desde otros orígenes.
- GET /api/health permite comprobar el proceso sin mostrar datos ni credenciales. No certifica disponibilidad de mercado o IA.
- DATA_DIR permite guardar SQLite en un volumen persistente independiente de la carpeta del código.
- OLLAMA_BASE_URL permite conectar con una instancia de Ollama accesible desde el servidor. No debe exponerse Ollama directamente a Internet. No se ha probado todavía una instancia remota.

## Configuración de la instancia de evaluación

Variables del servidor (nunca en el cliente ni en Git):

| Variable | Función |
|---|---|
| APP_MODE=hosted | Activa el modo alojado y sus controles |
| PUBLIC_ORIGIN | Origen final HTTPS, sin rutas, por ejemplo https://nombre.example |
| PORT | Puerto de escucha que indique el alojamiento, mayor o igual a 1024 |
| DATA_DIR | Directorio del volumen persistente |
| REVIEW_USER | Usuario de prueba; por defecto jurado |
| REVIEW_PASSWORD | Contraseña de prueba aleatoria de al menos 24 caracteres |
| ALPHA_VANTAGE_API_KEY | Clave privada, pendiente de resolver condiciones para la evaluación |
| OLLAMA_BASE_URL | Dirección privada accesible de Ollama; por defecto localhost:11434 |
| OLLAMA_MODEL | Modelo descargado; por defecto llama3.2:1b para reducir memoria |
| AUTO_CHECKS=false | Desactiva diagnósticos al arrancar y periódicos; el botón manual sigue disponible |

La instancia de evaluación debe utilizar su propia base, sin copiar las carteras personales. El acceso de prueba es compartido: sus usuarios ven y modifican los mismos ejercicios; no existen cuentas independientes. Las credenciales no son una autorización del proveedor para compartir sus datos.

## Decisiones pendientes antes de publicar

1. Elegir alojamiento, acceso a la cuenta y presupuesto autorizado. No se ha contratado ningún servicio de pago.
2. Confirmar las condiciones de uso de las cotizaciones ante acceso del jurado. Alpha Vantage describe su licencia como personal y no comercial y considera usos fuera de actividades privadas e individuales dentro del alcance comercial. No se ha confirmado permiso para compartir el histórico. No publicar precios ni una copia de SQLite en GitHub.
3. Probar Ollama en la infraestructura elegida. No presentar respuestas guardadas como inferencia nueva ni sustituirlo por una API de pago sin decisión del usuario.
4. Crear GitHub preservando el historial local y revisar secretos antes de enviar. GitHub está conectado, pero todavía no hay remoto para este proyecto.
5. Comprobar URL, credenciales, crear/operar/avanzar, comparación, IA, reinicio y conservación de datos desde otro dispositivo. Docker no está instalado en el equipo: la imagen todavía no se ha construido.

## Opciones de alojamiento revisadas

Render permite servicios web gratuitos, pero su sistema de archivos es efímero: SQLite se pierde al reiniciar, redesplegar o entrar en suspensión. Tras 15 minutos sin tráfico puede suspenderse; volver a arrancar tarda aproximadamente un minuto. El plan gratuito no ofrece disco persistente. Por tanto, no basta subir la versión actual a Render gratuito para conservar carteras. Una demostración reiniciable necesita un diseño y aviso explícitos; la conservación permanente exige almacenamiento apropiado.

Fuentes oficiales consultadas el 14/10/2026:
- https://render.com/docs/free
- https://render.com/docs/disks
- https://www.alphavantage.co/terms_of_service/

## Consulta preparada para Alpha Vantage

Texto para que el titular de la cuenta pueda consultar al proveedor; no se ha enviado ningún mensaje:

> Estoy desarrollando una aplicación educativa sin operaciones reales para un hackatón de mi curso. Utiliza series diarias compactas de AAPL, MSFT, GOOGL, AMZN, IBM y SPY con mi API key gratuita. Necesito que un jurado pueda acceder a una demostración alojada, protegida con credenciales de prueba, durante la evaluación del 20 al 27 de octubre de 2026, y mostrar gráficos en un vídeo del proyecto. No publicaré la API key ni los datos brutos en GitHub. ¿Está permitido este uso con mi cuenta gratuita? Si no, ¿qué autorización necesitaría para la demostración y el vídeo?
