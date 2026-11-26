# Base de datos

El esquema completo está en `database/schema.sql`.

### Esquema recreado desde cero
**Qué:** se borró el primer esquema (tabla `usuarios` con `password_hash`) y se creó
uno nuevo adaptado a Supabase Auth.

**Por qué:** con Supabase Auth, las contraseñas ya no se guardan en tablas propias.

### Tablas
| Tabla | Clase del diagrama | Columnas principales |
|---|---|---|
| `perfiles` | Usuario | `id` (= id de Auth), `nombre`, `fecha_registro`, `baneado`, `rol` |
| `posts` | Post | `id`, `usuario_id`, `contenido`, `fecha`, `oculto` |
| `comentarios` | Comentario | `id`, `post_id`, `usuario_id`, `texto`, `fecha`, `oculto` |
| `me_gusta` | MeGusta | `id`, `post_id`, `usuario_id`, `fecha` |

### Validaciones en la base de datos
**Qué:** longitudes (`check`), unicidad (`unique`) y valores por defecto se definen en
las tablas. Por ejemplo, `unique (post_id, usuario_id)` impide dar dos me gusta al mismo post.

**Por qué:** el cliente puede manipularse; la base de datos es la única garantía.

### Identificadores
**Qué:** `uuid` en `perfiles` (el de Supabase Auth) y `bigint generated always as identity`
en el resto.

**Por qué:** el uuid de Auth no es predecible; en posts y comentarios el id no es sensible
y un entero ocupa menos. `generated always` impide que el cliente elija el id.

### Ocultar en vez de borrar
**Qué:** la moderación marca `oculto = true` en posts y comentarios.

**Por qué:** las decisiones de moderación se pueden revertir.

### Borrado en cascada e índices
**Qué:** comentarios y me gusta se borran en cascada con su post (composición del
diagrama). Hay índices en `posts(fecha desc)` y `comentarios(post_id)`.

**Por qué:** el foro ordena por fecha y los comentarios se buscan por post;
PostgreSQL no indexa solo las claves foráneas.

### Perfil creado por un trigger
**Qué:** al registrarse en Auth, el trigger `al_registrarse` ejecuta `crear_perfil()`,
que crea la fila en `perfiles` con el `nombre` enviado en el registro. El rol siempre
empieza en `USUARIO`.

**Por qué:** el alta en Auth y el perfil van en la misma operación: si el perfil falla
(nombre repetido o inválido), se cancela también el usuario. Nadie puede registrarse
con privilegios.

**Descartado:** crear el perfil desde React (dos operaciones que pueden quedar a medias
y obligaría a permitir inserciones en `perfiles` desde el cliente).

### Políticas RLS: denegación por defecto
**Qué:** RLS está activado en todas las tablas y solo se permite lo necesario:

| Tabla | SELECT | INSERT | DELETE |
|---|---|---|---|
| `perfiles` | Autenticados | — (trigger) | — |
| `posts` | No ocultos; MODERADOR y ADMIN ven todos | Propio y no baneado | — |
| `comentarios` | No ocultos; MODERADOR y ADMIN ven todos | Propio y no baneado | — |
| `me_gusta` | Autenticados | Propio y no baneado | Propio y no baneado |

Ninguna tabla tiene política de UPDATE.

**Por qué:** toda operación sin política queda prohibida. La condición
`usuario_id = auth.uid()` impide suplantar a otro usuario, porque `auth.uid()` sale del
token firmado por Supabase. Los usuarios sin sesión no pueden leer nada.

### Funciones auxiliares
**Qué:** `rol_actual()` y `esta_baneado()` (sin sesión devuelve `true`).

**Por qué:** centralizan la comprobación de permisos en un solo sitio. Son
`security definer` para que las políticas de `perfiles` puedan consultarlas sin
recursión infinita.

### Funciones de moderación y administración
**Qué:**
- `cambiar_visibilidad_post` y `cambiar_visibilidad_comentario`: MODERADOR y ADMIN.
- `cambiar_baneo` y `cambiar_rol`: solo ADMIN, y nunca sobre sí mismo.

Se llaman desde React con `supabase.rpc()` y lanzan un error si no hay permiso.

**Por qué:** son la única vía para modificar `oculto`, `baneado` y `rol`, y solo tocan
esa columna. Usan `coalesce(rol_actual(), 'USUARIO')` porque sin sesión el rol es `null`
y `null not in (...)` no es verdadero, lo que permitiría saltarse la comprobación.
Todas fijan `search_path = ''`, la medida de seguridad recomendada para `security definer`.

**Descartado:** políticas de UPDATE por rol (no limitan columnas).

### Primer administrador
**Qué:** tras registrarse desde la web, se asigna a mano en el SQL Editor de Supabase
(no sujeto a RLS). El resto de roles se gestionan desde el panel de administración.

**Nota:** no se pueden crear usuarios desde Authentication → Add user, porque no envía
el `nombre` y el trigger cancela el alta. Es el comportamiento esperado.
