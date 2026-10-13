# Simulador de inversión IA

## Estado real

Pantalla de Mercado con gráficos, preparación de conexiones, análisis alineado y **cartera manual con operaciones virtuales**. La regla 20/50 sigue siendo educativa: no ejecuta órdenes automáticas. Las carteras automáticas y de referencia quedan pendientes. No hay datos inventados en los ejercicios de activos reales.

## Utilizar la cartera

Entra en «Cartera virtual». Puedes crear ejercicios independientes con 100 EUR, elegir práctica histórica o seguimiento diario y conservar todos los ejercicios anteriores. Los costes de comisión y empeoramiento se fijan al crear cada ejercicio (por defecto 0,1 % cada uno; admiten 0–5 %, con dos decimales porcentuales).

- Histórica: comienza en la sesión común número 50 y conserva una copia de los precios, divisas y verificaciones usados. «Avanzar una sesión» procesa la próxima apertura y actualiza el valor al cierre. No se puede rebobinar una cartera ni colocar una orden con una fecha arbitraria.
- Diaria: comienza en la última sesión común disponible. «Incorporar datos guardados» combina nuevos registros con los originales y procesa sesiones posteriores; primero debes descargar los nuevos datos desde Preparación. Sin datos nuevos, las órdenes siguen pendientes. Las correcciones de datos ya usados suspenden la actualización para revisión.
- Comprar: introduce un presupuesto TOTAL en euros, incluidos costes. Se reserva ese importe y se calcula la cantidad fraccionada al ejecutar con la apertura siguiente. No se conoce ni se muestra el precio futuro al enviar la orden.
- Vender: introduce una cantidad de acciones/fracciones. «Vender todo lo disponible» utiliza la cantidad exacta conservada. Las acciones reservadas por otra venta no pueden venderse dos veces.
- Cancelar: solo órdenes pendientes; libera la reserva y conserva el registro.

El valor total es efectivo más posiciones valoradas al cierre. El coste base incluye comisiones de compra. La venta parcial asigna una parte proporcional de ese coste; el resultado realizado es el abono neto menos el coste asignado. El resultado pendiente de venta compara el valor actual con el coste restante, sin descontar una futura comisión de venta. Las cifras visibles se redondean; los saldos se conservan con 12 decimales mediante enteros de precisión arbitraria. Los cargos y comisiones se redondean hacia arriba en esa unidad mínima; los abonos y las fracciones, hacia abajo, para no gastar más del presupuesto.

Los precios están en USD y el saldo en EUR. Para cada apertura y valoración se utiliza la última referencia BCE de un día ESTRICTAMENTE anterior a la sesión, nunca la publicada en esa fecha después de la apertura estadounidense. Si tiene más de siete días o falta, se bloquea el avance. Es una aproximación conservadora, no un cambio ofrecido por un intermediario.

Los desdoblamientos se consultan con SPLITS, una solicitud por activo/día adicional a la de precios (hasta 12 consultas diarias entre ambas para este catálogo). La falta de verificación, un evento dentro del periodo ya recorrido o un salto apertura/cierre previo superior al 30 % bloquean operaciones. Si afecta a una posición existente se suspende el avance para evitar una valoración incorrecta. No se aplican dividendos, impuestos, intereses, apalancamiento ni operaciones reales.

El historial muestra fechas de decisión y ejecución, apertura original, precio simulado, referencia de cambio y comisión. Se puede exportar CSV. La evolución del valor se muestra como tabla por sesión. No hay gráfico de rentabilidad de cartera todavía.

Los ejercicios «Demostración verificada» y «Prueba de seguimiento diario» contienen comprobaciones identificadas. «Mi cartera» y «Mi cartera diaria» se preparan limpios con 100 EUR para tu uso. Puedes recuperar ejercicios anteriores desde el selector; crear otro no borra nada.

## Utilizar Mercado

La pantalla inicial es Mercado. Selecciona uno de los seis activos y una sesión de análisis. Los botones Anterior, Siguiente y Última sesión permiten recorrer el histórico disponible. La app pide al servidor únicamente cierres hasta la fecha elegida; al cambiar de fecha retira los datos anteriores mientras carga para evitar mostrar información posterior al nuevo corte.

El gráfico representa cierres en verde, media de 20 sesiones en dorado y media de 50 en azul. Las medias aparecen desde las sesiones 20 y 50 respectivamente. El puntero o el control accesible «Explorar puntos del gráfico» permiten consultar cada valor. La variación porcentual es respecto al cierre de la sesión previa, no la rentabilidad de una cartera. Las cifras del gráfico usan números aproximados solo para dibujar; los indicadores del servidor conservan la precisión decimal definida.

«Ver cierres y medias utilizados» muestra la tabla completa hasta el corte. «Consultar comentario de IA» utiliza el mismo activo y fecha del gráfico. El comentario se borra al cambiar activo o fecha. «Preparación y conexiones» conserva los controles de diagnóstico. La vista de Mercado no provoca nuevas descargas externas: utiliza los registros almacenados. Para incorporar nuevos datos vuelve a Preparación y comprueba las conexiones cuando el límite diario permita una descarga.

Node 24 y Git están disponibles. La clave personal está configurada, las seis series reales han sido validadas y Ollama responde con llama3.2:3b. Las respuestas libres del modelo pueden contener errores. El panel nuevo usa una respuesta estructurada, comprueba que coincida con los cálculos y muestra únicamente frases revisadas. Consulta VERIFICACION.md para resultados y límites.

## Fechas y explicaciones

El panel «Fechas alineadas y explicación comprobable» compara solo sesiones presentes en todos los activos. Conserva las series originales y muestra su última fecha junto a la fecha común. No rellena huecos ni usa cierres posteriores a la fecha de análisis. En los datos probados hay 99 sesiones comunes y la última es el 12 de octubre de 2026.

SMA20 y SMA50 son los promedios de los últimos 20 y 50 cierres de esas sesiones compartidas. La comparación se realiza con enteros de precisión arbitraria, manteniendo los decimales originales; las cifras visibles se truncan a seis decimales. Si faltan 50 registros no se produce señal. COMPRA/VENTA/MANTENER son resultados de una regla sin tener en cuenta una cartera, todavía inexistente.

La explicación esencial se genera desde los cálculos. Ollama clasifica señal, relación, concepto y advertencia mediante JSON limitado. La aplicación exige concordancia exacta, rechaza campos extra, conceptos ajenos y garantías. El comentario visible se construye con frases revisadas: no es prosa financiera libre creada por el modelo. Si falla la validación o la conexión, se conserva la explicación calculada. Se guarda la respuesta validada según datos, fecha, modelo y versión para no repetir consultas innecesarias.

Interfaces locales: GET /api/market (opcional asOf=AAAA-MM-DD) devuelve solo sesiones comunes hasta el corte; POST /api/explain recibe symbol y asOf, y devuelve el análisis y un comentario validado o no disponible. No permiten órdenes ni cambian saldos.

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
3. Mercado, gráficos y cartera manual construidos, con compras/ventas y ejecución decimal.
4. Añadir cartera automática y referencia SPY para comparar con las mismas fechas y costes.
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

`npm test` incluye 21 pruebas: proveedores, fechas, indicadores, comentarios, operaciones, divisas, costes, reservas, bloqueos de desdoblamientos, persistencia y restauración. `npm run build` comprueba tipos y compila la interfaz. El ensayo de compra/venta con precios reales se conserva en el ejercicio identificado de demostración.
