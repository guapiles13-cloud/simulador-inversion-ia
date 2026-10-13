# Simulador de inversión IA

## Estado real

Versión 0.1: preparación del proyecto y comprobador de viabilidad. **Todavía no implementa carteras, operaciones, gráficos ni estrategias.** Su desarrollo queda condicionado a validar las conexiones acordadas. No hay datos inventados.

Se comprobó que Node 24 y Git están disponibles en el entorno de Codex. No se encontró una clave de Alpha Vantage configurada ni un servicio Ollama respondiendo. No es posible certificar la cobertura gratuita de los seis activos ni el rendimiento de IA hasta configurar ambos requisitos.

## Abrir

Requiere Node.js 24 y npm. En la carpeta del proyecto:

```powershell
npm install
npm run build
npm start
```

Abre http://127.0.0.1:4317. El servidor acepta exclusivamente conexiones locales. La pantalla muestra los requisitos pendientes, permite comprobarlos y conserva los resultados en SQLite.

Si trabajas dentro de Codex puedes usar `Iniciar.ps1`, que busca Node y npm instalados o el runtime ya disponible de Codex. No instala herramientas del sistema. Desde PowerShell: `powershell -ExecutionPolicy Bypass -File .\Iniciar.ps1`.

## Configurar cotizaciones

1. Obtén una clave propia en https://www.alphavantage.co/support/#api-key.
2. Copia `.env.example` como `.env` y completa `ALPHA_VANTAGE_API_KEY` localmente. No pegues la clave en el chat ni la publiques.
3. Reinicia la aplicación y pulsa «Comprobar conexiones».

Consulta TIME_SERIES_DAILY compact para los seis símbolos. Conserva el JSON original, los precios como cadenas decimales, procedencia y fecha de descarga. Una solicitud por símbolo y día de Madrid, incluso si falla; así reiniciar o pulsar repetidamente no consume nuevas consultas. Un intento fallido se vuelve a intentar al día siguiente. Los datos anteriores se conservan. La clave demo no demuestra acceso personal y se rechaza.

La prueba exige 51 sesiones por símbolo y coherencia de apertura, máximo, mínimo y cierre. No certifica aún frescura, derechos de redistribución ni acciones corporativas. Deben comprobarse antes del simulador. El diagnóstico no exporta los datos de mercado.

## Preparar Ollama

Instala https://ollama.com/download/windows y ejecuta:

```powershell
ollama pull llama3.2:3b
```

Si tu ordenador necesita un modelo menor:

```powershell
ollama pull llama3.2:1b
```

La aplicación consulta los modelos locales y pide una explicación breve. Prueba primero 3b y después 1b si ya está descargado. El umbral provisional es 45 segundos; muestra la respuesta para revisar su español. Una respuesta recibida no prueba todavía la fidelidad financiera del modelo. No se instala ni descarga Ollama automáticamente y no hay sustitución por servicios de pago.

## Datos y copias

`data/simulador.sqlite` contiene verificaciones y respuestas; `.env` contiene la clave. Ambos están excluidos de Git. Para una copia de seguridad manual, cierra la aplicación y copia toda la carpeta `data`. Para restaurar, cierra la aplicación y reemplaza `data` con tu copia. No existe aún un botón de copia ni se ha validado una restauración de carteras, porque no hay carteras.

## Próximas etapas

1. Validar las conexiones con tu cuenta y revisar el rendimiento/respuesta de IA.
2. Confirmar frescura y tratamiento de desdoblamientos de precios sin ajustar, y disponibilidad temporal de referencias BCE.
3. Construir mercado y gráficos; después cartera y ejecución decimal.
4. Añadir estrategia automática, referencia SPY y reproducción histórica sin datos futuros.
5. Integrar explicaciones sobre señales calculadas, exportaciones y documentación del curso.

Condiciones acordadas: 100 EUR por cartera, fracciones, 0,1 % de comisión y 0,1 % de empeoramiento, ejecución en apertura siguiente, medias 20/50 y máximo 20 % por acción para nuevas posiciones automáticas. No habrá dividendos ni impuestos en v1.

## Fuentes oficiales consultadas el 13 de octubre de 2026

- https://www.alphavantage.co/documentation/
- https://www.alphavantage.co/support/
- https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html
- https://docs.ollama.com/windows
- https://docs.ollama.com/api/tags
- https://ollama.com/library/llama3.2

## Verificación

`npm test` comprueba orden temporal, conservación de decimales, coherencia OHLC, errores de cuota, histórico insuficiente y extracción BCE. `npm run build` comprueba tipos y compila la interfaz. Las pruebas de operaciones e inversión se añadirán al implementar esos componentes.
