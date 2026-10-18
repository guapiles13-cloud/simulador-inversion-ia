# Simulador de inversión IA

## Estado real

Pantalla de Mercado, conexiones, análisis alineado y **carteras manual, automática y referencia SPY con operaciones virtuales**. La regla 20/50 produce las decisiones automáticas; la IA solo participa en los comentarios limitados del panel de análisis. No hay datos inventados en los ejercicios de activos reales.

## Cartera automática y comparación

Dentro de Cartera virtual, «Activar automática y referencia SPY» vincula dos carteras nuevas al ejercicio seleccionado. Empiezan con 100 EUR en su misma fecha y usan sus precios guardados, divisas y costes. Activar no cambia el efectivo, posiciones u órdenes de la cartera manual. Si ya has avanzado, reproduce las decisiones desde el inicio, usando solo los cierres disponibles en cada fecha.

Al avanzar una sesión histórica o incorporar nuevos datos diarios, las tres carteras avanzan juntas dentro de una sola transacción. Una incidencia que impida valorar una posición suspende y revierte el avance conjunto. En seguimiento diario no existe un temporizador de operaciones: primero se incorporan cotizaciones y luego se procesan las sesiones disponibles. Con el ordenador apagado no hay vigilancia permanente.

Regla automática:

- SMA20 > SMA50 y sin posición abierta: nueva compra, con presupuesto de hasta el 20 % del valor al cierre anterior, incluidos los costes. Se limita además al efectivo disponible.
- SMA20 < SMA50 y con posición: venta de toda la posición en la apertura siguiente.
- Igualdad, posición ya compatible o ausencia de datos: mantener. No se añaden compras diarias sobre posiciones abiertas.
- Las ventas se registran primero y las compras en orden alfabético AAPL, AMZN, GOOGL, IBM, MSFT. El presupuesto de compra se decide con el efectivo libre al cierre: no se anticipan ingresos desconocidos de ventas pendientes. Pueden invertirse en sesiones posteriores.
- Los bloqueos de datos, desdoblamientos y divisas son los mismos de la cartera manual.

El 20 % limita el presupuesto de NUEVA entrada. No es un límite permanente sobre el peso de una posición: puede aumentar o disminuir con precios y divisas, ya que no hay rebalanceo diario.

SPY recibe una orden de compra por el presupuesto de 100 EUR al inicio y mantiene la posición. Se ejecuta en la apertura siguiente bajo los mismos costes; si está bloqueado, queda sin operar hasta disponer de una sesión válida. Es rentabilidad por precio, sin reinversión de dividendos ni impuestos.

El panel muestra el valor de las tres carteras, un gráfico en euros, posiciones, órdenes pendientes/ejecutadas y cada señal/propuesta con sus medias y razones. Las órdenes y las propuestas están separadas: una propuesta no prueba una ejecución. Hay CSV de automática y SPY mediante los enlaces del panel. No se puede modificar manualmente ninguna de las dos carteras vinculadas.

«Demostración automática» contiene un ensayo histórico completo separado. Los ejercicios del usuario conservan sus propias operaciones; sus saldos y fechas cambian al utilizarlos.

## Utilizar la cartera

Para limpiar las pruebas, selecciona un ejercicio y pulsa **Quitar ejercicio**, justo debajo de los selectores. Revisa el nombre y confirma **Quitar de la lista**. Se oculta del selector sin perder saldo, órdenes, datos ni comparación automática. Mientras esté retirado no se puede avanzar ni operar. En **Ejercicios retirados**, pulsa **Recuperar** para volver a utilizarlo. No se elimina definitivamente ningún ejercicio.

Entra en «Cartera virtual». Puedes crear ejercicios independientes con 100 EUR, elegir práctica histórica o seguimiento diario y conservar todos los ejercicios anteriores. Los costes de comisión y empeoramiento se fijan al crear cada ejercicio (por defecto 0,1 % cada uno; admiten 0–5 %, con dos decimales porcentuales).

- Histórica: comienza en la sesión común número 50 y conserva una copia de los precios, divisas y verificaciones usados. «Avanzar una sesión» procesa la próxima apertura y actualiza el valor al cierre. No se puede rebobinar una cartera ni colocar una orden con una fecha arbitraria.
- Diaria: comienza en la última sesión común disponible. «Incorporar datos guardados» combina nuevos registros con los originales y procesa sesiones posteriores; primero debes descargar los nuevos datos desde Preparación. Sin datos nuevos, las órdenes siguen pendientes. Las correcciones de datos ya usados suspenden la actualización para revisión.
- Comprar: introduce un presupuesto TOTAL en euros, incluidos costes. Se reserva ese importe y se calcula la cantidad fraccionada al ejecutar con la apertura siguiente. No se conoce ni se muestra el precio futuro al enviar la orden.
- Vender: introduce una cantidad de acciones/fracciones. «Vender todo lo disponible» utiliza la cantidad exacta conservada. Las acciones reservadas por otra venta no pueden venderse dos veces.
- Cancelar: solo órdenes pendientes; libera la reserva y conserva el registro.

El valor total es efectivo más posiciones valoradas al cierre. El coste base incluye comisiones de compra. La venta parcial asigna una parte proporcional de ese coste; el resultado realizado es el abono neto menos el coste asignado. El resultado pendiente de venta compara el valor actual con el coste restante, sin descontar una futura comisión de venta. Las cifras visibles se redondean; los saldos se conservan con 12 decimales mediante enteros de precisión arbitraria. Los cargos y comisiones se redondean hacia arriba en esa unidad mínima; los abonos y las fracciones, hacia abajo, para no gastar más del presupuesto.

Los precios están en USD y el saldo en EUR. Para cada apertura y valoración se utiliza la última referencia BCE de un día ESTRICTAMENTE anterior a la sesión, nunca la publicada en esa fecha después de la apertura estadounidense. Si tiene más de siete días o falta, se bloquea el avance. Es una aproximación conservadora, no un cambio ofrecido por un intermediario.

Los desdoblamientos se consultan con SPLITS, una solicitud por activo/día adicional a la de precios (hasta 12 consultas diarias entre ambas para este catálogo). La falta de verificación, un evento dentro del periodo ya recorrido o un salto apertura/cierre previo superior al 30 % bloquean operaciones. Si afecta a una posición existente se suspende el avance para evitar una valoración incorrecta. No se aplican dividendos, impuestos, intereses, apalancamiento ni operaciones reales.

El historial muestra fechas de decisión y ejecución, apertura original, precio simulado, referencia de cambio y comisión. Se puede exportar CSV. La evolución del valor se muestra como tabla por sesión y, al activar la comparación, como gráfico conjunto en euros.

Los ejercicios de demostración contienen comprobaciones identificadas. Cada nuevo ejercicio empieza con 100 EUR; crear otro conserva los anteriores. Puedes recuperar ejercicios retirados desde el control correspondiente.

## Utilizar Mercado

La pantalla inicial es Mercado. Selecciona uno de los seis activos y una sesión de análisis. Los botones Anterior, Siguiente y Última sesión permiten recorrer el histórico disponible. La app pide al servidor únicamente cierres hasta la fecha elegida; al cambiar de fecha retira los datos anteriores mientras carga para evitar mostrar información posterior al nuevo corte.

El gráfico representa cierres en verde, media de 20 sesiones en dorado y media de 50 en azul. Las medias aparecen desde las sesiones 20 y 50 respectivamente. El puntero o el control accesible «Explorar puntos del gráfico» permiten consultar cada valor. La variación porcentual es respecto al cierre de la sesión previa, no la rentabilidad de una cartera. Las cifras del gráfico usan números aproximados solo para dibujar; los indicadores del servidor conservan la precisión decimal definida.

«Ver cierres y medias utilizados» muestra la tabla completa hasta el corte. «Consultar comentario de IA» utiliza el mismo activo y fecha del gráfico. El comentario se borra al cambiar activo o fecha. «Preparación y conexiones» conserva los controles de diagnóstico. La vista de Mercado no provoca nuevas descargas externas: utiliza los registros almacenados. Para incorporar nuevos datos vuelve a Preparación y comprueba las conexiones cuando el límite diario permita una descarga.

Node 24 y Git están disponibles. La clave personal está configurada y las seis series reales han sido validadas. El modelo predeterminado es llama3.2:1b para reducir memoria; llama3.2:3b se conserva como alternativa local. Las respuestas libres del modelo pueden contener errores. El panel usa una respuesta estructurada, comprueba que coincida con los cálculos y muestra únicamente frases revisadas. Consulta VERIFICACION.md para resultados y límites.

## Fechas y explicaciones

El panel «Fechas alineadas y explicación comprobable» compara solo sesiones presentes en todos los activos. Conserva las series originales y muestra su última fecha junto a la fecha común. No rellena huecos ni usa cierres posteriores a la fecha de análisis. En los datos probados hay 99 sesiones comunes y la última es el 12 de octubre de 2026.

SMA20 y SMA50 son los promedios de los últimos 20 y 50 cierres de esas sesiones compartidas. La comparación se realiza con enteros de precisión arbitraria, manteniendo los decimales originales; las cifras visibles se truncan a seis decimales. Si faltan 50 registros no se produce señal. En Mercado, COMPRA/VENTA/MANTENER son señales generales. La automática las combina con sus posiciones y efectivo para decidir si propone una orden.

La explicación esencial se genera desde los cálculos. Ollama clasifica señal, relación, concepto y advertencia mediante JSON limitado. La aplicación exige concordancia exacta, rechaza campos extra, conceptos ajenos y garantías. El comentario visible se construye con frases revisadas: no es prosa financiera libre creada por el modelo. Si falla la validación o la conexión, se conserva la explicación calculada. Se guarda la respuesta validada según datos, fecha, modelo y versión para no repetir consultas innecesarias.

Interfaces locales: GET /api/market (opcional asOf=AAAA-MM-DD) devuelve solo sesiones comunes hasta el corte; POST /api/explain recibe symbol y asOf, y devuelve el análisis y un comentario validado o no disponible. No permiten órdenes ni cambian saldos.

## Abrir

En Windows, haz doble clic en **Abrir aplicacion.cmd** desde esta carpeta. Inicia el servidor y abre http://127.0.0.1:4318. Mantén la ventana de inicio abierta mientras pruebas la aplicación; puedes minimizarla. Si ya está encendida, el acceso reutiliza el servidor sin iniciar otro.

Si reinicias el ordenador o cierras la ventana de inicio, vuelve a usar ese acceso. La dirección local necesita el servidor en marcha. Este proyecto está ahora en `C:\Eduardo\Proyectos\simulador de inversion`; se han recuperado los archivos, datos, modelos y versiones de la carpeta original sin borrar el original.

Requiere Node.js 24 y npm. En la carpeta del proyecto:

```powershell
npm install
npm run build
npm start
```

Abre http://127.0.0.1:4318. En su modo predeterminado el servidor acepta conexiones locales; el modo alojado se configura por separado. La pantalla muestra los requisitos pendientes, permite comprobarlos y conserva los resultados en SQLite.

También puedes usar `Iniciar.ps1`, que busca Node instalado o el runtime ya disponible de Codex y utiliza la copia local de npm en work si no está instalado. No instala herramientas del sistema. Desde PowerShell: `powershell -ExecutionPolicy Bypass -File .\Iniciar.ps1`. Se utiliza el puerto 4318 tanto en el acceso como en la configuración y el valor por defecto del servidor.

## Configurar cotizaciones

1. Obtén una clave propia en https://www.alphavantage.co/support/#api-key.
2. Copia `.env.example` como `.env` y completa `ALPHA_VANTAGE_API_KEY` localmente. No pegues la clave en el chat ni la publiques.
3. Reinicia la aplicación y pulsa «Comprobar conexiones».

Consulta TIME_SERIES_DAILY compact para los seis símbolos. Conserva el JSON original, los precios como cadenas decimales, procedencia y fecha de descarga. Una solicitud por símbolo y día de Madrid, incluso si falla; así reiniciar o pulsar repetidamente no consume nuevas consultas. Un intento fallido se vuelve a intentar al día siguiente. Los datos anteriores se conservan. La clave demo no demuestra acceso personal y se rechaza.

La prueba exige 51 sesiones por símbolo y coherencia de apertura, máximo, mínimo y cierre. No certifica frescura ni derechos de redistribución. Los desdoblamientos se consultan por separado y bloquean operaciones hasta disponer de la verificación necesaria; antes del despliegue debe confirmarse el permiso de exhibición de datos. El diagnóstico no exporta los datos de mercado.

## Preparar Ollama

Instala https://ollama.com/download/windows y ejecuta:

```powershell
ollama pull llama3.2:1b
```

En `.env`, utiliza `OLLAMA_MODEL=llama3.2:1b`. Para volver al modelo mayor, descárgalo y cambia esa variable a `llama3.2:3b`:

```powershell
ollama pull llama3.2:3b
```

La aplicación usa el modelo configurado y pide una clasificación breve, con un contexto de 2048 tokens y un máximo de 140 tokens de salida. Libera el modelo de memoria tras cada respuesta (`keep_alive: 0`); una consulta nueva tendrá que cargarlo otra vez. La caché evita repetir explicaciones ya validadas. El umbral provisional es 45 segundos; valida la clasificación y muestra frases revisadas. Una respuesta recibida no prueba todavía la fidelidad financiera del modelo. No se instala ni descarga Ollama automáticamente y no hay sustitución por servicios de pago.

Para comprobar la IA local con las seis series reales guardadas y un caso de datos insuficientes, ejecuta `node scripts/check-ai.mjs llama3.2:1b`. Lee SQLite sin modificarla, no consulta proveedores y deja el informe de tiempos y memoria comunicada por Ollama en `work/ai-1b.json`. Puedes repetirlo con `llama3.2:3b` para comparar en el mismo ordenador. La asignación del modelo no equivale a la RAM total de un servidor; el alojamiento requiere su propia prueba.

## Datos y copias

`data/simulador.sqlite` contiene mercado, comprobaciones, ejercicios y comparaciones; `.env` contiene la clave. Ambos están excluidos de Git. Ejecuta `node scripts/backup-db.mjs` para crear una copia consistente mediante SQLite en `data/backups`, abrirla por separado y comprobar integridad y recuentos. No modifica los ejercicios originales. Respeta DATA_DIR si está configurado. Las copias contienen los ejercicios privados y no se suben a GitHub.

Para restaurar una copia, cierra el servidor y conserva primero el directorio de datos actual completo. Utiliza una carpeta de datos nueva con la copia renombrada como `simulador.sqlite`; no mezcles una copia restaurada con archivos WAL/SHM de otra base. La configuración y los modelos se conservan por separado. No hay un botón de restauración. Las pruebas automatizadas y el ensayo de copia validan bases independientes; no se ha sustituido tu base personal.

## Próximas etapas

1. Validar las conexiones con tu cuenta y revisar el rendimiento/respuesta de IA.
2. Confirmar frescura y tratamiento de desdoblamientos de precios sin ajustar, y disponibilidad temporal de referencias BCE.
3. Mercado, gráficos y cartera manual construidos, con compras/ventas y ejecución decimal.
4. Cartera automática y referencia SPY construidas, con comparación bajo las mismas fechas y costes.
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

`npm test` incluye 39 pruebas: proveedores, fechas, indicadores, comentarios, operaciones, divisas, costes, reservas, bloqueos, persistencia, restauración, retirada de ejercicios y comparación automática. Incluye múltiples ventas con pérdidas, invariancia ante cambios en datos futuros, activación repetida/tardía, compras limitadas, ausencia de aumentos diarios de posiciones, ampliación del histórico y resumen de últimas semanas. `npm run build` comprueba tipos y compila la interfaz.

## Ayuda dentro de la aplicación

El menú «Cómo usar la app» ofrece una guía breve: crear y nombrar un ejercicio, registrar una orden, avanzar una sesión, consultar el historial y comparar carteras. Explica las modalidades histórica y diaria, los datos reales y las operaciones simuladas. «Pendiente» en conexiones significa que la última comprobación no fue válida o falta hacerla; no describe la situación bursátil de la empresa. Se conservan los datos anteriores. El historial se consulta dentro de Cartera virtual.

## Preparación para alojamiento

Consulta [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md). El servidor conserva por defecto el acceso local. La aplicación está desplegada en [OVHcloud con HTTPS](https://vps-e30b6a76.vps.ovh.ca/), con acceso de prueba compartido, SQLite persistente y Ollama `llama3.2:1b`. La instalación real es nativa en Ubuntu, con arranque automático; el Dockerfile se conserva como alternativa preparada, sin afirmar que se haya ensayado. Las credenciales se facilitan por separado y las claves del proveedor permanecen en el servidor. La exhibición de cotizaciones al jurado y en vídeo requiere aclarar las condiciones del proveedor. La prueba HTTP aislada puede ejecutarse con `node scripts/check-hosting.mjs`; utiliza una base vacía en work y el puerto 4329, y cierra su servidor al acabar.

Los ejercicios históricos pueden continuar con «Actualizar hasta la última sesión», conservando el historial. Las correcciones de precios o divisas se suspenden para revisión.

Actualización continua del mismo ejercicio: «Actualizar hasta la última sesión» incorpora los datos descargados y procesa cada apertura pendiente hasta la última fecha común, con automática y SPY. Conserva el historial anterior y puede usarse tanto en ejercicios históricos como diarios. Las órdenes pendientes pueden ejecutarse durante ese avance. «Avanzar una sesión» permite hacerlo paso a paso.

La interfaz recuerda en este navegador la última pantalla y el último ejercicio seleccionado. Si no existe una preferencia, abre Mi cartera cuando esté disponible. En Posiciones abiertas, pulsa el símbolo del activo para abrir una gráfica pequeña sin cambiar de pantalla. Utiliza los datos del ejercicio hasta su sesión actual, sin mostrar sesiones futuras.

El comentario incluye un resumen calculado de las últimas 5 y 20 sesiones: variación entre cierres, rango de los últimos 20 cierres y mayor variación diaria de los últimos 20 intervalos. Usa únicamente precios guardados hasta la fecha elegida, con porcentajes calculados mediante enteros decimales. Está separado de la clasificación validada de Ollama, que conserva modelo y contexto. No añade noticias, consultas al proveedor ni predicciones.
