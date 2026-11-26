# Frontend (client/) · Contexto para agentes de IA

Lee primero el `AGENTS.md` de la raíz.

## Stack
- React + Vite, **JavaScript** (archivos `.jsx` / `.js`), sin TypeScript.
- `@supabase/supabase-js` para datos y autenticación.
- `react-router-dom` para la navegación.
- ESLint (configuración por defecto de Vite).
- Componentes funcionales con hooks. Nada de componentes de clase.

## Conexión con Supabase
- El cliente se crea **una sola vez** en `src/lib/supabaseClient.js`. Impórtalo así:
  `import { supabase } from '../lib/supabaseClient'` (ajusta la ruta relativa).
- **No crees otros clientes** con `createClient`.
- Variables de entorno (en `client/.env.local`, con prefijo obligatorio `VITE_`):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`

## Datos disponibles (resumen; detalle en `database/AGENTS.md`)
| Tabla | Columnas |
|---|---|
| `perfiles` | `id` (uuid = id de Auth), `nombre`, `fecha_registro`, `baneado`, `rol` |
| `posts` | `id`, `usuario_id`, `contenido`, `fecha`, `oculto` |
| `comentarios` | `id`, `post_id`, `usuario_id`, `texto`, `fecha`, `oculto` |
| `me_gusta` | `id`, `post_id`, `usuario_id`, `fecha` (único por post y usuario) |

- `usuario_id` se rellena solo con el usuario de la sesión: **no lo envíes** al insertar.
- Las políticas RLS ya filtran lo que cada usuario puede ver (por ejemplo, los posts
  ocultos solo los ven moderadores y admins). No dupliques esa lógica como seguridad.
- Usuarios sin sesión no pueden leer nada.

## Registro
El registro **debe** enviar el nombre en los metadatos; si no, falla (lo exige un trigger):
```js
supabase.auth.signUp({ email, password, options: { data: { nombre } } })
```
`nombre`: entre 3 y 30 caracteres y único.

## Acciones de moderación y administración
**No hagas `update` directos** sobre `posts`, `comentarios` ni `perfiles`: están bloqueados
por diseño. Usa estas funciones:
```js
supabase.rpc('cambiar_visibilidad_post', { p_post_id, p_oculto })              // MODERADOR, ADMIN
supabase.rpc('cambiar_visibilidad_comentario', { p_comentario_id, p_oculto })  // MODERADOR, ADMIN
supabase.rpc('cambiar_baneo', { p_usuario_id, p_baneado })                     // ADMIN
supabase.rpc('cambiar_rol', { p_usuario_id, p_rol })                           // ADMIN
```
Si quien llama no tiene permiso, la función lanza un error: muéstralo al usuario.

## Usuarios baneados
Pueden iniciar sesión, pero la base de datos les rechaza publicar, comentar y dar me gusta.
La interfaz debe avisarles y ocultar esos botones.

## Correspondencia con el diagrama de clases
| Clase | Implementación |
|---|---|
| DataBaseManager | `src/lib/supabaseClient.js` |
| LoginManager | `supabase.auth` |
| UserManager / ForumManager | Módulos JS con las consultas y llamadas `rpc` |
| MainPage, Forum, AdminPanel | Componentes/páginas de React |

## Convenciones
- Interfaz, nombres de componentes y comentarios en español.
- Componentes en PascalCase (`PostCard.jsx`); funciones y variables en camelCase.
- Al instalar una dependencia, haz commit de `package.json` y `package-lock.json`,
  y documenta en `docs/cliente.md` por qué se eligió.