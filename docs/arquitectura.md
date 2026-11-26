# Arquitectura

### React + Supabase sin backend propio
**Qué:** la web es solo un cliente React que habla directamente con Supabase mediante
la librería oficial `supabase-js`. Se abandonó el backend Express inicial.

**Por qué:**
- Supabase ya ofrece API sobre PostgreSQL, autenticación y almacenamiento: un backend
  propio duplicaría esa funcionalidad.
- La seguridad está en la base de datos (RLS y funciones SQL), porque el código del
  cliente es público y manipulable.
- Escala a la v2: Supabase incluye PostGIS para calcular el territorio y Edge Functions
  si hiciera falta lógica en servidor.

**Descartado:** Express + PostgreSQL (más código, despliegue y mantenimiento sin
funcionalidad nueva); llamadas `fetch` a la API REST (gestión manual de tokens y cabeceras).

### Autenticación con Supabase Auth
**Qué:** registro e inicio de sesión con email y contraseña mediante Supabase Auth.

**Por qué:** gestiona de forma segura el hash de contraseñas, las sesiones (JWT) y la
recuperación de cuenta.

**Descartado:** tabla propia de contraseñas (insegura sin backend).

### Roles guardados en la base de datos
**Qué:** el rol (`USUARIO`, `MODERADOR`, `ADMIN`) está en la tabla `perfiles` y las
políticas RLS lo consultan con una función SQL.

**Por qué:** un cambio de rol o un baneo tiene efecto inmediato.

**Descartado:** guardar el rol en el JWT (no cambiaría hasta renovar el token).

### Acciones privilegiadas con funciones SQL
**Qué:** ocultar contenido, banear y cambiar roles se hace con funciones
`security definer` que comprueban el rol de quien las llama.

**Por qué:** RLS controla filas, no columnas. Una política de UPDATE dejaría modificar
también el contenido, el autor o el propio rol.

### Acceso del equipo a Supabase
**Qué:** el proyecto `feudo` (región Frankfurt) pertenece a una organización de Supabase
con un integrante como *Owner* y los demás como *Developer*.

**Por qué:** todos trabajan sin compartir credenciales y cada acción queda asociada a su autor.

### Correspondencia con el diagrama de clases
| Clase del diagrama | Implementación |
|---|---|
| DataBaseManager | `client/src/lib/supabaseClient.js` |
| LoginManager | `supabase.auth` |
| UserManager / ForumManager | Módulos JS con consultas y llamadas `rpc` |
| Usuario | Tabla `perfiles` (vinculada a `auth.users`) |
| Post, Comentario, MeGusta | Tablas `posts`, `comentarios`, `me_gusta` |
