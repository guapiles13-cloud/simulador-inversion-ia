# Verificación de la versión 0.1

Revisión: 13 de octubre de 2026.

## Resultado

- Compilación de TypeScript e interfaz de producción: correcta.
- Cuatro pruebas de datos: correctas.
- Dependencias instaladas y auditadas: sin vulnerabilidades reportadas en la instalación.
- Servidor accesible en `http://127.0.0.1:4317`; HTML y estado HTTP 200.
- Solicitudes de diagnóstico desde origen externo: rechazadas con HTTP 403; origen local: aceptado con HTTP 202.
- BCE: descarga real validada, 7113 referencias USD, última fecha 2026-10-13.
- Clave de Alpha Vantage: configurada localmente, excluida de Git y no expuesta por el estado HTTP ni los archivos compilados del cliente.
- Alpha Vantage: seis activos validados con 100 sesiones cada uno. Un reintento de diagnóstico de las cuatro series inicialmente fallidas fue correcto. No se confirmó la causa de los primeros fallos.
- Última sesión Apple/Amazon: 2026-10-12; Microsoft/Alphabet/IBM/SPY: 2026-10-13. Se deben alinear las fechas antes de comparar carteras.
- Histórico común de los seis activos: 99 sesiones, del 2026-05-21 al 2026-10-12. Hay referencias BCE anteriores para todas esas fechas. No se detectaron saltos apertura/cierre previo mayores del 30 %, pero esto no certifica ausencia de desdoblamientos.
- Ollama: llama3.2:3b descargado y respondiendo localmente. Prueba inicial 13,2 segundos; prueba contextual 7,7 segundos. Produce español comprensible, pero confundió medias móviles con precios de índices e hizo inferencias no justificadas. **Conectividad validada; fidelidad financiera todavía pendiente.** No utilizar sus comentarios para decidir operaciones.
- SQLite: resultados persistidos en `data/simulador.sqlite`; no se incluyen en Git.

## Persistencia y recuperación

Se creó una copia consistente de SQLite mediante VACUUM INTO y se abrió como base independiente. PRAGMA integrity_check devolvió ok y se recuperaron las siete respuestas de mercado/divisas. La copia de prueba queda en data/backups, fuera de Git. No hay carteras que restaurar todavía.

## Límites de esta comprobación

La interfaz se abrió y revisó visualmente en el navegador integrado, en http://127.0.0.1:4318. Las ocho tarjetas muestran conexión verificada; los apartados de simulación están expresamente pendientes. Se pulsó el botón de diagnóstico y el servidor actualizó la prueba local de IA. No se ha probado aún vista móvil, reinicio completo de Windows, carteras, rentabilidad, ejecución de órdenes ni ausencia de futuro en simulaciones: esos componentes todavía no existen. Las pruebas sobre errores de cuota son pruebas del lector con entradas controladas, no una validación de cómo se agota una cuota real.

## Decisión de avance

Etapa 1 preparada; conexiones de la etapa 2 verificadas. Antes de integrar la IA como explicador, corregir/limitar sus explicaciones y probarlas con casos de compra, venta, igualdad y datos insuficientes. Se pueden preparar mercado y gráficos con fechas alineadas. El simulador no está implementado. No se han publicado claves en el chat; los modelos se guardan en data/models.

## Corrección de fechas y explicaciones

- Implementado análisis por intersección de sesiones: los seis activos terminan el 2026-10-12 para la comparación, con 99 registros comunes. Las series originales permanecen intactas.
- Probado un corte al 2026-08-03: se devuelven 50 sesiones y ningún cierre posterior, incluso si ya está guardado en la base.
- Cálculo SMA20/SMA50 con comparación decimal exacta; explicación esencial producida por código.
- IA limitada a clasificación estructurada con validación de señal, comparación, concepto y advertencia. El comentario visible usa frases revisadas. Texto libre, señales contradictorias, campos extra y garantías se rechazan.
- Diez pruebas automáticas correctas y compilación correcta.
- Ollama real pasó COMPRA, VENTA, MANTENER y SIN_DATOS, alrededor de 3 segundos por caso con el modelo ya cargado. La prueba inicial de arranque fue de 7,6 segundos.
- API de explicación validada con datos reales de AAPL hasta la fecha común; segunda consulta devuelve la misma respuesta guardada.
- Panel revisado en navegador integrado: fecha original y de análisis, indicadores, señal educativa, explicación y comentario.

La mejora garantiza las restricciones del texto mostrado, no la exactitud de respuestas financieras libres del modelo. No hay carteras ni operaciones todavía; el tratamiento completo de acciones corporativas y las conversiones de las futuras operaciones siguen pendientes.

Referencia de respuestas estructuradas: https://docs.ollama.com/capabilities/structured-outputs (consultada el 13 de octubre de 2026).
