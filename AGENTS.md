# Simulador de inversión IA

Aplicación educativa personal en español. Capital virtual: 100 EUR. Nunca ejecutar operaciones reales.

La etapa de viabilidad precede al simulador: validar AAPL, MSFT, GOOGL, AMZN, IBM, SPY, divisas BCE y una respuesta de Ollama en español. No sustituir datos reales por precios inventados ni presentar esta preparación como simulador terminado.

Claves solo en .env del servidor, nunca en frontend, respuestas HTTP, logs o Git. Solo servicios locales; no añadir proveedores de pago sin decisión del usuario.

Arquitectura prevista: React/TypeScript, Node/TypeScript, SQLite. Operaciones e indicadores con aritmética decimal al construir el motor. Señales 20/50, ejecuciones en apertura siguiente, sin datos futuros. Comparar manual, automática y SPY bajo los mismos costes. No permitir desdoblamientos sin tratamiento validado.

Validar con npm run build y npm test. Guardar versiones estables en Git. Mantener documentación y límites fieles al estado real.
