### Estructura del repositorio
| Carpeta / archivo | Contenido |
|---|---|
| `client/` | Aplicación web en React + Vite |
| `database/schema.sql` | Script SQL del esquema de Supabase, versionado para poder recrear la base de datos desde cero |
| `docs/` | Documentación técnica |
| `.gitignore` | Archivos excluidos del control de versiones |
| `README.md` | Presentación del proyecto |

### Archivos excluidos (`.gitignore`)
Se excluyen las dependencias (`node_modules/`), los builds (`dist/`), los logs y,
sobre todo, los archivos `.env` con las claves de Supabase, para no publicar
credenciales. Se mantiene `.env.example` como plantilla sin valores reales.

### README
El `README.md` presenta el proyecto en GitHub: descripción, equipo, tecnologías
y entregas. La justificación técnica detallada se mantiene en `docs/documentacion.md`
para no sobrecargar el README.

### Convención de commits
Se sigue **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`…) para que el
historial sea legible y se identifique el tipo de cada cambio.

### Flujo de ramas
Se usa una versión simplificada de **Git Flow**:
- `main`: solo versiones estables y entregadas.
- `develop`: rama de integración y rama por defecto del repositorio.
- `feature/<nombre>`: una rama por funcionalidad, creada desde `develop` e integrada
  mediante Pull Request revisada por otro integrante.

| Alternativa | Motivo de descarte |
|---|---|
| Trabajar todos en `main` | Riesgo de romper la versión estable y conflictos constantes |
| Git Flow completo (`release/*`, `hotfix/*`) | Demasiado complejo para tres personas y dos entregas |
| Trunk-based development | Requiere integración continua y tests automáticos que aún no tenemos |

## 4. Base de datos

### Recreación del esquema
La primera versión del esquema guardaba los usuarios y sus contraseñas en una tabla
propia (`usuarios` con `password_hash`). Al pasar a Supabase Auth, esa tabla deja de
tener sentido, por lo que se eliminó el esquema anterior y se creó de nuevo desde cero.
Se borraron primero las tablas dependientes (`me_gusta`, `comentarios`, `posts`)
y después `usuarios` y el tipo `rol`.

### Tabla `perfiles`
Equivale a la clase `Usuario` del diagrama. Amplía la tabla `auth.users` de Supabase Auth
con los datos propios de la aplicación.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid (PK, FK → `auth.users`) | Mismo identificador que en Supabase Auth |
| `nombre` | text, único | Nombre público, entre 3 y 30 caracteres |
| `fecha_registro` | timestamptz | Fecha de alta, automática |
| `baneado` | boolean | Por defecto `false` |
| `rol` | enum `rol` | `USUARIO`, `MODERADOR` o `ADMIN`; por defecto `USUARIO` |

- `email` y `password` no se almacenan aquí: los gestiona Supabase Auth de forma segura.
- Se usa UUID en lugar de un entero autoincremental porque es el identificador de
  Supabase Auth y no es predecible.
- Las validaciones (`unique`, `check`, valores por defecto) se hacen en la base de datos
  porque el cliente puede ser manipulado.
- RLS está activado desde la creación: sin políticas, la tabla es inaccesible.

### Creación automática del perfil (trigger)
Al registrarse un usuario en Supabase Auth, el trigger `al_registrarse` (sobre
`auth.users`) ejecuta la función `crear_perfil()`, que inserta su fila en `perfiles`
con el mismo `id` y el `nombre` enviado desde el formulario de registro.

- La función es `security definer` porque el nuevo usuario aún no tiene permisos
  sobre `perfiles`; se fija `search_path = ''` como medida de seguridad recomendada.
- Solo se copia el nombre de los metadatos: el rol siempre se inicializa como
  `USUARIO`, impidiendo que un usuario se registre con privilegios.
- Si el perfil no puede crearse (nombre repetido o inválido), se cancela también el
  alta en Auth, garantizando que no existan usuarios sin perfil.

**Alternativa descartada:** crear el perfil desde React tras el registro. Requiere dos
operaciones separadas que podrían quedar a medias y obliga a permitir inserciones en
`perfiles` desde el cliente.

### Funciones auxiliares de permisos
- `rol_actual()`: devuelve el rol del usuario autenticado.
- `esta_baneado()`: indica si el usuario autenticado está baneado; si no hay sesión
  devuelve `true`, de modo que por defecto se deniega la escritura.

Ambas identifican al usuario con `auth.uid()`, que se obtiene del token JWT firmado
por Supabase y no puede ser falsificado desde el cliente. Son `stable` (no modifican
datos y PostgreSQL puede optimizarlas) y `security definer`, para que las políticas
RLS de `perfiles` puedan consultarlas sin provocar recursión infinita.

Centralizar estas comprobaciones evita repetir la misma consulta en cada política
y facilita cambiar la lógica de permisos en un único lugar.

### Políticas RLS de `perfiles`
| Operación | Quién | Cómo |
|---|---|---|
| SELECT | Usuarios autenticados | Todas las filas (para mostrar autores y el panel de admin) |
| INSERT | Nadie desde el cliente | Lo hace el trigger `crear_perfil()` |
| UPDATE | Nadie desde el cliente | Baneo y cambio de rol mediante funciones que verifican el rol ADMIN |
| DELETE | Nadie desde el cliente | Borrado en cascada al eliminar el usuario de Auth |

RLS sigue el principio de **denegación por defecto**: toda operación sin política que
la permita queda prohibida. Por eso no se crean políticas de escritura, evitando que un
usuario modifique su propio rol o su estado de baneo.

Leer los perfiles no expone datos sensibles: email y contraseña residen en `auth.users`,
inaccesible desde el cliente.

### Tabla `posts`
Equivale a la clase `Post` del diagrama.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint identity (PK) | Autoincremental, no lo elige el cliente |
| `usuario_id` | uuid (FK → `perfiles`) | Autor; por defecto el usuario de la sesión (`auth.uid()`) |
| `contenido` | text | Entre 1 y 2000 caracteres |
| `fecha` | timestamptz | Fecha de publicación, automática |
| `oculto` | boolean | Moderación: oculta sin borrar; por defecto `false` |

- Se usa `bigint identity` en lugar de UUID porque el id de un post no es sensible y
  ocupa menos; `generated always` impide que el cliente lo fije.
- Índice `posts_fecha_idx` sobre `fecha desc`, ya que el foro lista los posts del más
  reciente al más antiguo.
- Ocultar en lugar de borrar permite revertir decisiones de moderación.

### Políticas RLS de `posts`
| Operación | Quién | Condición |
|---|---|---|
| SELECT | Usuarios autenticados | Posts no ocultos; moderadores y admins ven también los ocultos |
| INSERT | Usuarios autenticados | El autor debe ser el propio usuario (`usuario_id = auth.uid()`) y no estar baneado |
| UPDATE | Nadie desde el cliente | Ocultar/mostrar mediante funciones que verifican el rol |
| DELETE | Nadie | La moderación oculta en lugar de borrar |

- `using` filtra qué filas existentes puede ver el usuario; `with check` valida las
  filas nuevas antes de insertarlas.
- La comprobación `usuario_id = auth.uid()` impide suplantar a otro usuario aunque
  el cliente envíe un identificador distinto.
- No se permite UPDATE directo porque RLS controla filas, no columnas: una política de
  actualización permitiría modificar también el contenido o el autor.

  ### Tabla `comentarios`
Equivale a la clase `Comentario` del diagrama (composición con `Post`).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint identity (PK) | Autoincremental |
| `post_id` | bigint (FK → `posts`) | Post comentado; se borra en cascada con el post |
| `usuario_id` | uuid (FK → `perfiles`) | Autor; por defecto `auth.uid()` |
| `texto` | text | Entre 1 y 1000 caracteres |
| `fecha` | timestamptz | Automática |
| `oculto` | boolean | Moderación; por defecto `false` |

- El borrado en cascada desde `posts` implementa la composición del diagrama:
  un comentario no existe sin su post.
- Índice `comentarios_post_id_idx`, ya que PostgreSQL no indexa automáticamente
  las claves foráneas y los comentarios siempre se consultan por post.

  ### Políticas RLS de `comentarios`
Siguen el mismo criterio que las de `posts`:

| Operación | Quién | Condición |
|---|---|---|
| SELECT | Usuarios autenticados | Comentarios no ocultos; moderadores y admins ven todos |
| INSERT | Usuarios autenticados | Autor = usuario de la sesión y no baneado |
| UPDATE / DELETE | Nadie desde el cliente | Ocultar/mostrar mediante funciones que verifican el rol |

Aplicar las mismas reglas a posts y comentarios hace el sistema de permisos
coherente y más fácil de mantener.