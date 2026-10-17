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

## Cartera automática y SPY

- Implementados compañeros vinculados a cada ejercicio: automática SMA20/50 en las cinco acciones, y referencia de compra/mantenimiento de SPY. Comparten capital inicial, fecha, conjunto de datos, divisas y costes con la manual.
- Propuestas al cierre y ejecución en apertura siguiente; ventas primero, compras alfabéticas, presupuesto de nueva entrada hasta el 20 % del valor y limitado al efectivo libre. Sin aumentos de posiciones ni anticipación de cobros pendientes.
- Activación idempotente; si se activa tarde, reproduce desde el inicio sin modificar la manual. Avances conjuntos en la misma transacción: los bloqueos revierten las tres carteras.
- Pruebas detectaron y corrigieron un fallo al acumular múltiples ventas con pérdidas: el resultado realizado negativo ahora se conserva y acumula correctamente.
- Compilación correcta y 28 pruebas automáticas correctas.
- Ensayo real en «Demostración automática»: 49 avances, del 2026-08-03 al 2026-10-12. Manual sin operaciones: 100 EUR; automática: 101,235446275138 EUR, con 10 operaciones ejecutadas; referencia SPY: 105,089854480731 EUR, una compra ejecutada. Resultados por precio bajo costes del 0,1 % y empeoramiento del 0,1 %, sin dividendos ni impuestos. No se ajustó la estrategia para mejorar el resultado observado.
- Comprobados CSV de automática y SPY. Seguimiento diario sin nueva sesión no avanza ni duplica órdenes.
- Activada comparación para «Mi cartera» y «Mi cartera diaria», verificando que saldos, fechas y órdenes manuales permanezcan idénticos.
- Navegador: revisados valores, gráfico, posiciones, contadores de operaciones y tabla desplegable de señales en el ejercicio de demostración. Al terminar se dejó seleccionado «Mi cartera», en su fecha original y con 100 EUR.

El límite del 20 % se aplica al presupuesto de entrada al cierre; no limita permanentemente pesos de posiciones ni anticipa cómo variará el mercado. La IA no toma decisiones de operación. Los resultados de este tramo histórico no demuestran resultados futuros.

## Recuperación y arranque, 14 de octubre de 2026

- La nueva carpeta de proyecto estaba vacía y el servidor del puerto 4318 no estaba en marcha. Recuperados código, versiones Git, configuración privada, datos, modelos, compilación y dependencias desde la carpeta original. El original se conserva.
- Puerto unificado a 4318 en la configuración, plantilla, servidor y acceso de inicio. Añadido Abrir aplicacion.cmd y corregido Iniciar.ps1 para localizar Node/npm, compilar, iniciar el servidor y mantener vivo su proceso mediante una ventana que puede minimizarse.
- Probado el arranque con Windows PowerShell 5.1 y la compilación. Una segunda ejecución reutilizó el servidor ya existente correctamente.
- Verificado HTTP 200, cinco ejercicios guardados y Mi cartera histórica con 100 EUR, cero órdenes manuales y comparación automática conservada.
- El servidor local requiere estar iniciado; después de reiniciar el ordenador se utiliza el acceso de inicio.

## Limpieza reversible de ejercicios

- Añadidos «Quitar ejercicio», aviso con nombre del ejercicio y «Ejercicios retirados» con recuperación.
- Se conserva el estado, conjunto de datos y comparación; las acciones de operar/avanzar se rechazan mientras el ejercicio está retirado.
- Compilación correcta y 30 pruebas correctas. Ensayo HTTP con un ejercicio técnico: retirado del selector, recuperación con estado exactamente idéntico y nuevo retiro de la prueba. No se han retirado ejercicios del usuario.

## Guía rápida de la aplicación · 14/10/2026

- Añadida «Cómo usar la app» al menú de todas las pantallas y a la navegación móvil. Incluye inicio en cuatro pasos, funciones de las pantallas, modalidades, comparación y límites.
- Aclarado el significado de Verificado/Pendiente en conexiones; retirado el enlace antiguo «Historial · Pendiente», pues el historial ya está en Cartera virtual.
- Estado guardado revisado: Alphabet, Amazon, IBM y SPY tienen una consulta de precios no validada. El mensaje genérico no permite atribuir el fallo a una causa concreta; los datos anteriores siguen guardados.
- Compilación y 30 pruebas correctas. Comprobada en navegador la guía, su enlace a cartera y el acceso a conexiones, sin crear órdenes ni modificar los ejercicios.

## Preparación de alojamiento · 14/10/2026

- Añadido modo alojado explícito con origen HTTPS, contraseña de prueba obligatoria, controles de Host/Origin y autenticación de páginas, datos, exportaciones y acciones. Se mantiene el modo local por defecto.
- Directorio de datos y dirección privada de Ollama configurables. Endpoint de salud sin datos de mercado ni carteras. Diagnósticos automáticos desactivables para pruebas aisladas.
- Añadidos Dockerfile y exclusión de archivos privados del contexto; Docker no está instalado, por lo que la imagen aún no se ha construido.
- Compilación correcta y 34 pruebas correctas. Prueba HTTP en proceso separado y base vacía: salud 200, carteras sin credenciales 401, carteras autenticadas 200, interfaz autenticada 200 y acción desde otro origen 403. El servidor de prueba se cierra; los ejercicios personales no se modifican.
- GitHub conectado; no hay remoto del proyecto. Pendientes alojamiento, autorización para compartir cotizaciones del proveedor, prueba de Ollama alojado y URL final. Ningún servicio de pago contratado ni cotización publicada.

## Preparación de la entrega y copia de seguridad · 14/10/2026

- Red y plantilla de Oracle creadas por el participante y comprobadas en capturas. Ampere A1 devolvió Out of capacity en Madrid AD-1; la plantilla se guardó sin Apply. No hay servidor ni URL pública.
- Preparados localmente documento técnico, registro de 36 instrucciones recuperadas de la sesión original y guion de vídeo de 4 minutos y 30 segundos. Historial con plan completo, sin metadatos de navegador, imágenes de cuentas ni correos personales. Borradores y enlaces privados de trabajo excluidos de Git.
- Carpeta y dos Google Docs creados. La inserción de contenido fue rechazada por revisión automática al exigir autorización explícita para ese contenido y destino; los Docs permanecen vacíos dentro de la carpeta y no se han cambiado permisos públicos.
- Compilación correcta y 34 pruebas correctas. Revisados 42 archivos versionados: sin .env, claves SSH, directorios privados ni la clave configurada dentro de sus contenidos.
- Añadido script de copia SQLite. Copia real abierta de forma independiente: integrity_check=ok, siete ejercicios, tres comparaciones, dos ejercicios retirados y siete conjuntos de datos. No se sustituyó ni modificó la base personal.

## IA local de menor memoria · 16/10/2026

- Predeterminado y configuración local cambiados a llama3.2:1b. Conservado llama3.2:3b como alternativa, sin borrar modelos ni modificar ejercicios. Ningún servicio de pago añadido.
- Contexto limitado a 2048 tokens y salida a 140; keep_alive=0 descarga el modelo de memoria tras cada respuesta. La consulta siguiente puede tener coste de carga. Se conservan validación semántica estricta y frases revisadas en español.
- Prueba real reproducible con scripts/check-ai.mjs: lectura SQLite sin escritura, seis series reales alineadas (99 sesiones comunes hasta 12/10/2026) y un caso insuficiente basado en las primeras 49 observaciones reales. Ambos modelos pasan 7/7. No se refrescan proveedores ni se inventan precios.
- En este PC, CPU (VRAM=0), mismo contexto: 3b informa de un máximo de 2.330.848.131 bytes asignados al modelo y 7,3–10,0 s por consulta; 1b, 1.454.291.025 bytes y 4,7–4,9 s. Reducción aproximada 37,6 %. Informes privados work/ai-3b.json y work/ai-1b.json. Son muestras de asignación de Ollama, no RAM total del equipo ni garantía de rendimiento en un VPS de 4 GB.
- Confirmado por HTTP en la aplicación local: AAPL devuelve modelo llama3.2:1b, status validado, texto español y 4,6 s. Ollama ps vacío después de la consulta confirma descarga de memoria. La única escritura de esta comprobación es la caché de explicación; no se modifican ejercicios ni cotizaciones.
- npm run build correcto y npm test: 34 pruebas correctas. Servidor local arrancado para la verificación con AUTO_CHECKS=false, sin consultas nuevas a proveedores. La configuración de los próximos arranques sigue siendo la existente.
- Pendiente: probar alojamiento con menos RAM y comprobar velocidad, estabilidad y persistencia en el servidor real; no hay nuevo despliegue público.

## 17/10/2026: ampliar ejercicios históricos
- Añadido botón «Ampliar con nuevos datos»: agrega sesiones comunes descargadas sin avanzar ni ejecutar órdenes. Automática y SPY siguen sincronizadas al avanzar.
- Compilación correcta y 36 pruebas superadas, incluidas conservación de estado, ampliación con ventanas parciales, idempotencia y rollback por correcciones o desdoblamientos.
- Prueba local real: ejercicio Demostración automática ampliado con cuatro sesiones hasta 16/10. Estado e historial manual y comparación idénticos a la copia previa; continúa en 12/10 con avance disponible. No se han avanzado sesiones del usuario.

### Continuidad del mismo ejercicio
El botón visible se sustituye por «Actualizar hasta la última sesión»: incorpora y procesa todas las sesiones nuevas en una única transacción, tanto para histórica como para diaria. Mantiene inicio, órdenes anteriores y curvas, y sincroniza automática y SPY. Build correcto y 37 pruebas superadas, incluida idempotencia al actualizar sin datos nuevos. En la interfaz local Mi cartera conserva inicio 03/08/2026 y fecha 16/10/2026.

## 17/10/2026: recordar cartera y consulta rápida de posiciones
Preferencias locales con manejo de almacenamiento no disponible; selección validada contra los ejercicios existentes y alternativa Mi cartera. Gráfica modal accesible con cierre y Escape, reutilizando cierres y medias; endpoint de solo lectura limitado a la fecha de la cartera y sujeto a la autenticación existente. Compilación correcta y 37 pruebas superadas. Verificación visual: Mi cartera permanece seleccionada tras ir a Mercado y volver, y tras recargar; clic en AAPL abre gráfica desde 21/05 hasta 16/10/2026 en una ventana compacta y Escape la cierra. No se han modificado saldos ni operaciones.

## 17/10/2026: comentario útil de las últimas semanas
Resumen calculado en servidor con cierres reales hasta el corte elegido, 5/20 intervalos y rangos de cierres. Se muestra incluso si la IA no responde y se recalcula junto a respuestas de IA almacenadas. No cambia la entrada, opciones, modelo ni número de consultas de Ollama; no se han añadido servicios o fuentes. Compilación y 39 pruebas correctas: subida, caída, plano, datos insuficientes y exclusión de futuro. UI comprobada en Apple a 16/10/2026 con resumen y comentario validado. No se ha medido de nuevo el consumo total del proceso; el modelo mantiene su configuración previa.
