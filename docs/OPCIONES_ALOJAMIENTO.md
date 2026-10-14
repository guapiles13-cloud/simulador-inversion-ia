# Opciones para presentar el proyecto

Consulta de documentación oficial: 14 de octubre de 2026. No se han creado cuentas, contratado servidores ni desplegado servicios. Los importes y cuotas deben confirmarse en la cuenta antes de activar recursos.

## Necesidades

URL HTTPS accesible al jurado durante la evaluación del 20 al 27 de octubre; Node 24; conservación de SQLite; Ollama con llama3.2:3b o, si el rendimiento no es suficiente, prueba explícita de 1b; credenciales de prueba; base independiente de las carteras personales. La memoria disponible permite seleccionar candidatos, pero no demuestra su velocidad: falta un ensayo real.

## Comparación

| Opción | Coste orientativo | Cambios y límites |
|---|---|---|
| Oracle Always Free, Ampere A1 | 0 dentro de sus cuotas gratuitas | Hasta 2 OCPU y 12 GB de RAM en total, más almacenamiento gratuito. Mantendría Node, SQLite y Ollama. Requiere cuenta y verificación con tarjeta; puede faltar capacidad. Oracle puede recuperar servidores considerados inactivos. Hay que confirmar región y recursos asignados. |
| Servidor virtual de 8 GB, por ejemplo Hetzner CX33 | Tarifa documentada: 8,49 EUR/mes más 0,50 EUR por IPv4, antes de impuestos, extras y dominio si se compra | 4 vCPU, 8 GB RAM, 80 GB disco. Puede alojar los tres componentes sin cambiar el proveedor de IA ni la base. Requiere administrar Linux, HTTPS y copias; rendimiento y disponibilidad sin comprobar en una cuenta. La web consultada muestra los planes como no disponibles; no se garantiza poder contratar este modelo. |
| Render gratuito + Supabase gratuito + IA remota con cuota gratuita | Potencialmente 0 dentro de los límites | Render ejecutaría Node, Supabase conservaría datos y un proveedor como Groq serviría la IA. Exige migrar almacenamiento y adaptar/validar el comentario del nuevo modelo. Ya no sería Ollama alojado. Render puede dormir; Supabase puede pausarse por poca actividad; la IA tiene cuotas. No basta desplegar el código actual. |
| Render Starter con disco | 7,25 USD/mes para servidor y 1 GB de disco, antes de impuestos y excesos de uso | Sirve para Node y SQLite, pero sus 512 MB no bastan para el modelo Ollama previsto. Hace falta otra solución para IA; no es el coste total de nuestra arquitectura. |

Hugging Face Docker Spaces tampoco se debe presupuestar como totalmente gratuito: la documentación actual exige un plan de pago para crear un Docker Space, aunque CPU Basic no tenga precio por hora. No es nuestra primera opción para mantener una app siempre disponible.

## Recomendación

Primero comprobar la viabilidad de Oracle Always Free, con una prueba acotada de alta y disponibilidad, sin pasar a recursos de pago. Si no podemos disponer pronto de un servidor, elegir un servidor virtual de 8 GB con un presupuesto concreto revisado antes de contratar. Un presupuesto orientativo de 11-15 EUR al mes para servidor, IPv4 e impuestos permite buscar candidatos; no es un precio final ni incluye todos los extras.

La vía gratuita combinada es posible de investigar, pero requiere más cambios y cuentas. No utilizarla como sustitución automática de la preferencia de Ollama.

Antes de aceptar cualquier candidato: comprobar arranque, respuesta real de IA, operaciones, comparación y recuperación tras reiniciar; verificar el acceso desde otro dispositivo. Mantener el alojamiento hasta finalizar la evaluación, no solo hasta el día de entrega. En paralelo, aclarar con Alpha Vantage la autorización para mostrar los datos al jurado y en el vídeo. No publicar cotizaciones ni credenciales en el repositorio.

## Fuentes oficiales

- Oracle: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
- Registro Oracle: https://www.oracle.com/cloud/free/faq/
- Hetzner recursos/disponibilidad: https://www.hetzner.com/cloud/cost-optimized/
- Tarifas Hetzner: https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/
- IPv4 Hetzner: https://docs.hetzner.com/cloud/servers/overview/
- Render: https://render.com/docs/free y https://render.com/pricing
- Supabase cuotas: https://supabase.com/docs/guides/platform/billing-on-supabase
- Supabase pausas: https://supabase.com/docs/guides/platform/free-project-pausing
- Groq cuotas: https://console.groq.com/docs/rate-limits
- Hugging Face: https://huggingface.co/docs/hub/spaces-overview
