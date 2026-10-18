# Preparación del despliegue para el hackatón

Revisión: 18 de octubre de 2026. Estado: desplegado en un VPS OVHcloud Ubuntu 24.04 (2 vCPU, 4 GB, 40 GB). URL HTTPS protegida: https://vps-e30b6a76.vps.ovh.ca. Renovación manual sin compromiso, vencimiento 18/11/2026.

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

1. Alojamiento contratado por el usuario: OVHcloud VPS-1 2027 en Beauharnois, Canadá; primer mes autorizado por 5,43 EUR con IVA. No se han ampliado recursos.
2. Confirmar las condiciones de uso de las cotizaciones ante acceso del jurado. Alpha Vantage describe su licencia como personal y no comercial y considera usos fuera de actividades privadas e individuales dentro del alcance comercial. No se ha confirmado permiso para compartir el histórico. No publicar precios ni una copia de SQLite en GitHub.
3. Ollama llama3.2:1b probado en el VPS: 7/7 respuestas estructuradas validadas (seis activos y datos insuficientes), entre 14,9 y 16,0 segundos. No se ha añadido una API de IA de pago.
4. Repositorio público creado mediante exportación depurada del historial: https://github.com/guapiles13-cloud/simulador-inversion-ia. Publicar la versión final antes de entregar; nunca enviar datos, claves o capturas con cotizaciones.
5. HTTPS, acceso privado (401 sin credenciales), protección de origen (403), creación/compra/avance/comparación, IA y persistencia tras reinicio del servicio comprobados. Pendiente prueba visual del usuario desde navegador habitual y móvil. La instalación usa Node 24 nativo y systemd; no se ha usado Docker.

## Opciones de alojamiento revisadas

Render permite servicios web gratuitos, pero su sistema de archivos es efímero: SQLite se pierde al reiniciar, redesplegar o entrar en suspensión. Tras 15 minutos sin tráfico puede suspenderse; volver a arrancar tarda aproximadamente un minuto. El plan gratuito no ofrece disco persistente. Por tanto, no basta subir la versión actual a Render gratuito para conservar carteras. Una demostración reiniciable necesita un diseño y aviso explícitos; la conservación permanente exige almacenamiento apropiado.

Fuentes oficiales consultadas el 14/10/2026:
- https://render.com/docs/free
- https://render.com/docs/disks
- https://www.alphavantage.co/terms_of_service/

## Consulta preparada para Alpha Vantage

Texto para que el titular de la cuenta pueda consultar al proveedor; no se ha enviado ningún mensaje:

> Estoy desarrollando una aplicación educativa sin operaciones reales para un hackatón de mi curso. Utiliza series diarias compactas de AAPL, MSFT, GOOGL, AMZN, IBM y SPY con mi API key gratuita. Necesito que un jurado pueda acceder a una demostración alojada, protegida con credenciales de prueba, durante la evaluación del 20 al 27 de octubre de 2026, y mostrar gráficos en un vídeo del proyecto. No publicaré la API key ni los datos brutos en GitHub. ¿Está permitido este uso con mi cuenta gratuita? Si no, ¿qué autorización necesitaría para la demostración y el vídeo?

## Instalación real en OVHcloud

- Código instalado: commit 755fcf4. Node v24.22.0, descarga oficial con SHA256 comprobado.
- Aplicación /opt/simulador, usuario de servicio sin acceso interactivo; SQLite persistente /var/lib/simulador. Arranque automático y reinicio por fallo mediante systemd.
- Archivo .env privado del servidor, sin credenciales en Git ni en las respuestas. El titular autorizó expresamente transferir su clave de Alpha Vantage, activar servicios y cortafuegos.
- Ollama escucha solo en 127.0.0.1:11434, llama3.2:1b, una inferencia paralela; la app conserva contexto 2048 y descarga el modelo de memoria al terminar.
- Caddy publica HTTPS con certificado válido en el nombre del VPS. Cortafuegos activo: entrada TCP 22/80/443; puertos internos 4318 y 11434 inaccesibles desde Internet.
- Consumo observado: app ~80 MB; pico de servicio Ollama ~2,87 GB en las pruebas iniciales. No es una garantía para más usuarios o modelos.
- Base separada con precios/divisas guardados; carteras personales del ordenador no copiadas. Hay una cartera nueva Mi cartera y el ensayo del servidor está retirado y recuperable.
- AUTO_CHECKS=false: la actualización de conexiones se solicita manualmente y respeta el control diario. Última sesión común guardada: 16/10/2026.
- Usuario y contraseña web en archivo privado local work/ovh-access/acceso-web.txt, excluido de Git. Las restricciones del navegador integrado pueden impedir su diálogo de autenticación; usar navegador habitual para la prueba visual.
