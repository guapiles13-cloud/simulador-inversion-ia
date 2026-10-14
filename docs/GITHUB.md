# Código preparado para GitHub

Para el curso se publicará solo código, configuración de ejemplo y documentación del funcionamiento. .env, SQLite, modelos y claves SSH se conservan fuera del repositorio. Las capturas se excluyen de todas las versiones publicables hasta aclarar las condiciones de exhibición de datos.

## Historial y copia de publicación

El repositorio original conserva todas sus versiones y capturas. `node scripts/prepare-github.mjs` genera un repositorio nuevo en work, con una lista de archivos permitidos, sin modificar el original. Conserva los mensajes, fechas, autores y relaciones entre las versiones de main. Los identificadores de commit cambian porque se retiraron archivos de sus árboles. No exporta otras referencias internas del agente.

El script comprueba que la clave configurada y material de claves privadas no aparezcan en los archivos exportados. Esta revisión no es una garantía general de ausencia de cualquier secreto desconocido; se revisa también la lista de archivos antes de enviar.

No ejecutar `git push` desde el repositorio original para publicar su historial sin filtrar. Los envíos se hacen desde la copia preparada. Los cambios posteriores se generan en el proyecto original y se vuelve a preparar la copia con el mismo procedimiento.

## Primer envío

1. Crear un repositorio vacío llamado simulador-inversion-ia en la cuenta del participante, sin README, licencia ni .gitignore generados por GitHub.
2. Configurar origin en la copia preparada con la URL real del repositorio creado.
3. Enviar únicamente main, sin --all ni --mirror y sin forzar referencias existentes.
4. Comprobar archivos, diez versiones iniciales, fechas y acceso del jurado. Repetir el recuento si se añaden nuevas versiones.
5. Añadir el enlace verificado a la documentación técnica y al registro de entrega.

La sesión del conector GitHub y la del navegador son independientes. Crear el repositorio mediante la web requiere iniciar sesión allí; Git por HTTPS puede pedir una autorización adicional mediante el gestor oficial de credenciales. No pegar contraseñas ni tokens en el chat, el código o las URLs remotas.
