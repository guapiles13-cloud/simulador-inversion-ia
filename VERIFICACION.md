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

## Pantalla de Mercado

- Gráfico de cierres y medias 20/50, selector de seis activos, fechas comunes, navegación por sesiones, variación respecto al cierre anterior y tabla de los datos utilizados.
- GET /api/sessions devuelve solo fechas disponibles; GET /api/market incluye los puntos del gráfico calculados con el corte elegido.
- Compilación correcta y doce pruebas automáticas correctas. Las medias del gráfico final coinciden con el análisis; no aparecen antes de tener sus respectivas ventanas.
- Prueba HTTP de los seis activos en primera sesión (2026-05-21), sesión 50 (2026-08-03) y última (2026-10-12): sin puntos futuros e indicadores consistentes.
- Navegador: probado cambio de Apple a Microsoft, corte de 50 sesiones, primera sesión sin medias, navegación a siguiente y última sesión, vuelta a Apple y comentario validado.
- La vista usa datos guardados; no se han descargado nuevas cotizaciones para construir los gráficos. No se han probado carteras ni operaciones, todavía pendientes.

## Cartera manual y operaciones virtuales

- Implementados ejercicios históricos y diarios independientes, inicio con 100 EUR, fracciones, reservas, compras, ventas parciales/totales, cancelación, historial y CSV.
- Precios históricos y costes quedan fijados por ejercicio; saldos y cantidades se guardan con 12 decimales y operaciones con enteros de precisión arbitraria. Órdenes y avances son transacciones SQLite; una petición duplicada no crea dos órdenes.
- Verificadas las seis respuestas SPLITS de Alpha Vantage con la cuenta configurada. Las operaciones se bloquean si no hay verificación, si hay un desdoblamiento dentro del periodo recorrido o un salto sospechoso. La valoración/avance de posiciones afectadas también se suspende.
- Compilación correcta y 21 pruebas automáticas correctas, incluyendo compra y venta parcial/total con cálculo manual, costes, reservas, duplicados, divisa anterior, imposibilidad de saltar sesiones, cancelación, bloqueo, rollback, persistencia y copia restaurada.
- Ejercicio real «Demostración verificada»: compra AAPL por 20 EUR decidida el 2026-08-03, ejecutada el 2026-08-04; venta total decidida el 4, ejecutada el 5. Efectivo final 100,392118440306 EUR y resultado realizado 0,392118440306 EUR. Son operaciones virtuales bajo los costes del ejercicio, no prueba de rentabilidad futura.
- Seguimiento diario: una compra pendiente permanece pendiente sin sesión nueva, y cancelarla restituye el saldo disponible. Creado un ejercicio diario limpio de 100 EUR separado de la prueba.
- Verificada exportación CSV y lectura persistida de la cartera por HTTP.
- Navegador: registrada una compra de 10 EUR en el ejercicio identificado de demostración, verificado saldo reservado de 10 EUR y liberación al cancelar. Creado «Mi cartera» desde la pantalla y comprobado saldo de 100 EUR, fecha inicial 2026-08-03 y cero órdenes. La prueba queda separada y accesible desde el selector.

Limitaciones: la comparación automática y SPY aún no están construidas. La evolución de cartera es una tabla, sin gráfico. No se simulan dividendos ni impuestos. La consulta SPLITS detecta eventos comunicados por el proveedor, sin garantizar ausencia de retrasos o errores del proveedor; los saltos grandes constituyen una protección adicional conservadora. La conversión utiliza referencias del día anterior, no precios de cambio ejecutables.

Fuente de desdoblamientos: https://www.alphavantage.co/documentation/#splits (consultada el 13 de octubre de 2026).
