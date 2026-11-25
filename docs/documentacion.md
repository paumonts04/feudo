# Feudo · Documentación técnica

Autores: Santiago Vivero, Samuel Izquierdo, Pau Montes

## 1. Control de versiones: Git y GitHub

### Decisión
El código se gestiona con **Git** y se aloja en **GitHub** (`paumonts04/feudo`, repositorio
privado), con los tres integrantes del equipo como colaboradores.

El repositorio se creó de nuevo al cambiar la arquitectura (eliminación del backend Express).
El repositorio anterior se renombró a `feudo-old` y se archivó en lugar de borrarse,
para conservar el trabajo previo sin que interfiera con el nuevo.

### Justificación
- **Git** permite trabajar los tres en paralelo, revisar cambios y volver a versiones anteriores.
- **GitHub** centraliza el código, facilita las Pull Requests para revisar el trabajo
  entre compañeros y deja constancia del historial de cada integrante.
- **Repositorio privado** hasta la defensa, para proteger el trabajo.

| Alternativa | Motivo de descarte |
|---|---|
| GitLab / Bitbucket | Funcionalidad equivalente; GitHub es el más usado y el que ya conocía el equipo |
| Compartir carpetas (Drive, zip) | Sin historial, sin control de conflictos ni revisión de cambios |
| Borrar el repositorio anterior | Irreversible; archivarlo conserva el trabajo sin riesgo |

### Estructura del repositorio
| Carpeta / archivo | Contenido |
|---|---|
| `client/` | Aplicación web en React + Vite |
| `database/schema.sql` | Script SQL del esquema de Supabase, versionado para poder recrear la base de datos desde cero |
| `docs/` | Documentación técnica |
| `.gitignore` | Archivos excluidos del control de versiones |
| `README.md` | Presentación del proyecto |
| `LICENSE` | Texto de la licencia MIT |

### Archivos excluidos (`.gitignore`)
Se excluyen las dependencias (`node_modules/`), los builds (`dist/`), los logs y,
sobre todo, los archivos `.env` con las claves de Supabase, para no publicar
credenciales. Se mantiene `.env.example` como plantilla sin valores reales.

### README
El `README.md` presenta el proyecto en GitHub: descripción, equipo, tecnologías,
entregas y licencia. La justificación técnica detallada se mantiene en este documento
para no sobrecargar el README.

### Licencia
El proyecto se publica bajo la **licencia MIT**: permite usar, copiar y modificar
el código siempre que se mantenga la autoría original.

| Alternativa | Motivo de descarte |
|---|---|
| GPL-3.0 | Obliga a publicar con la misma licencia cualquier versión derivada; más restrictiva de lo necesario para un proyecto educativo |
| Sin licencia | Impide cualquier reutilización del código |

### Convención de commits
Se sigue **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`…) para que el
historial sea legible y se identifique el tipo de cada cambio. Opcionalmente se indica
el ámbito entre paréntesis, por ejemplo `feat(database):`.

### Flujo de ramas
Se usa una versión simplificada de **Git Flow**:
- `main`: solo versiones estables y entregadas.
- `develop`: rama de integración y rama por defecto del repositorio.
- `feature/<nombre>`: una rama por funcionalidad, creada desde `develop` e integrada
  mediante Pull Request.

Los cambios que afectan al código o a la base de datos se integran siempre mediante
Pull Request revisada por otro integrante. Cada Pull Request indica en su descripción
qué incluye y los ID de las tareas del gestor que resuelve. Tras el merge, la rama
`feature/*` se elimina. Los cambios que solo afectan a la documentación (`docs/`,
`README.md`) pueden subirse directamente a `develop`.

| Alternativa | Motivo de descarte |
|---|---|
| Trabajar todos en `main` | Riesgo de romper la versión estable y conflictos constantes |
| Git Flow completo (`release/*`, `hotfix/*`) | Demasiado complejo para tres personas y dos entregas |
| Trunk-based development | Requiere integración continua y tests automáticos que aún no tenemos |

## 2. Arquitectura: React + Supabase sin backend propio

### Decisión
La aplicación web se compone únicamente de un cliente React (Vite) que se comunica
directamente con Supabase mediante la librería oficial `supabase-js`. Se descartó el
backend en Express desarrollado inicialmente.

### Justificación
- **Menos código y menos infraestructura**: Supabase ya ofrece API REST sobre PostgreSQL,
  autenticación y almacenamiento; un backend propio duplicaría esa funcionalidad.
- **Seguridad en la base de datos**: como el código del cliente es público, todos los
  permisos se aplican en PostgreSQL mediante Row Level Security (RLS) y funciones SQL.
  El cliente solo usa la clave pública; la clave `service_role` nunca sale de Supabase.
- **Escalable a la v2**: Supabase incluye PostGIS (cálculo geográfico del territorio)
  y Edge Functions si en el futuro se necesita lógica en servidor.

| Alternativa | Motivo de descarte |
|---|---|
| Backend Express + PostgreSQL | Más código, despliegue y mantenimiento sin aportar funcionalidad nueva |
| Llamadas `fetch` a la API REST | Obliga a gestionar tokens y cabeceras manualmente |
| Tabla propia con contraseñas | Inseguro sin backend; Supabase Auth gestiona hash, sesiones (JWT) y recuperación |

### Autenticación y roles
- El registro e inicio de sesión se hacen con **Supabase Auth** (email y contraseña).
- La tabla `perfiles` amplía `auth.users` con nombre, rol y estado de baneo. Se crea
  automáticamente mediante un trigger al registrarse un usuario.
- El rol (`USUARIO`, `MODERADOR`, `ADMIN`) se guarda en `perfiles` y las políticas RLS
  lo consultan con una función SQL. Se descartó guardarlo en el JWT porque los cambios
  de rol no serían inmediatos.
- Las acciones privilegiadas (ocultar contenido, banear, cambiar rol) se implementan
  como funciones SQL `security definer` que verifican el rol de quien las invoca,
  ya que RLS no permite restringir columnas concretas.
- Un usuario baneado puede iniciar sesión, pero las políticas le impiden publicar,
  comentar o dar me gusta.

### Correspondencia con el diagrama de clases
| Clase del diagrama | Implementación |
|---|---|
| DataBaseManager | Cliente `supabase` (`supabaseClient.js`) |
| LoginManager | `supabase.auth` |
| UserManager / ForumManager | Módulos JS que llaman a tablas y funciones RPC |
| Usuario | Tabla `perfiles` (vinculada a `auth.users`) |

### Acceso del equipo a Supabase
El proyecto `feudo` (región Frankfurt) pertenece a una organización de Supabase en la
que los tres integrantes son miembros: uno como *Owner* y los demás como *Developer*.
Así todos pueden trabajar sobre la base de datos sin compartir credenciales personales,
y cada acción queda asociada a su autor.

## 3. Base de datos

### Recreación del esquema
La primera versión del esquema guardaba los usuarios y sus contraseñas en una tabla
propia (`usuarios` con `password_hash`). Al pasar a Supabase Auth, esa tabla deja de
tener sentido, por lo que se eliminó el esquema anterior y se creó de nuevo desde cero.
Se borraron primero las tablas dependientes (`me_gusta`, `comentarios`, `posts`)
y después `usuarios` y el tipo `rol`.

El esquema completo se encuentra en `database/schema.sql`.

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

### Tabla `me_gusta`
Equivale a la clase `MeGusta` del diagrama (composición con `Post`).

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint identity (PK) | Autoincremental |
| `post_id` | bigint (FK → `posts`) | Post valorado; se borra en cascada con el post |
| `usuario_id` | uuid (FK → `perfiles`) | Usuario que da el me gusta; por defecto `auth.uid()` |
| `fecha` | timestamptz | Automática |

- La restricción `unique (post_id, usuario_id)` garantiza en la base de datos que un
  usuario solo puede dar un me gusta por post.
- El índice que crea esa restricción también se usa para contar los me gusta de
  un post, por lo que no se añade un índice adicional.

### Políticas RLS de `me_gusta`
| Operación | Quién | Condición |
|---|---|---|
| SELECT | Usuarios autenticados | Todos (para mostrar contadores) |
| INSERT | Usuarios autenticados | Usuario = el de la sesión y no baneado |
| DELETE | Usuarios autenticados | Solo sus propios me gusta y no baneado |
| UPDATE | Nadie | Un me gusta solo se da o se quita |

A diferencia de posts y comentarios, aquí sí se permite DELETE: quitar un me gusta
consiste en borrar su fila. En las políticas de DELETE se usa `using`, que determina
qué filas existentes puede borrar el usuario.

### Funciones de moderación
- `cambiar_visibilidad_post(p_post_id, p_oculto)`
- `cambiar_visibilidad_comentario(p_comentario_id, p_oculto)`

Permiten a moderadores y administradores ocultar (`true`) o volver a mostrar (`false`)
un post o comentario. Se invocan desde React con `supabase.rpc()`.

- Son `security definer` porque no existe política de UPDATE sobre estas tablas:
  la función es la única vía para modificar `oculto`, y no permite cambiar ninguna
  otra columna.
- Verifican dentro de la propia función que quien llama es MODERADOR o ADMIN y no
  está baneado; en caso contrario lanzan una excepción.
- Se usa `coalesce` porque, sin sesión, `rol_actual()` devuelve `null` y la
  comparación `null not in (...)` no se evalúa como verdadera, lo que permitiría
  saltarse la comprobación.

**Alternativa descartada:** una política RLS de UPDATE para moderadores. RLS controla
filas, no columnas, por lo que también podrían modificar el contenido o el autor.

### Funciones de administración
- `cambiar_baneo(p_usuario_id, p_baneado)`: banea (`true`) o desbanea (`false`).
- `cambiar_rol(p_usuario_id, p_rol)`: asigna `USUARIO`, `MODERADOR` o `ADMIN`.

- Solo pueden ejecutarlas administradores no baneados; en otro caso lanzan una excepción.
- Un administrador no puede modificar su propio baneo ni su rol, evitando que la
  aplicación se quede sin administradores por error.
- El parámetro `p_rol` es del tipo enum `rol`, por lo que PostgreSQL rechaza cualquier
  valor no válido.
- Son la única vía para modificar `baneado` y `rol`, ya que `perfiles` no tiene
  política de UPDATE.

### Creación del primer administrador
Como solo un ADMIN puede asignar roles, el primer administrador se asigna manualmente
desde el SQL Editor de Supabase (que se ejecuta como `postgres` y no está sujeto a RLS),
una vez registrado el usuario desde la aplicación. A partir de ahí, el resto de roles
se gestionan desde el panel de administración.

No es posible crear usuarios desde el panel de Supabase (Authentication → Add user):
al no enviar el `nombre` en los metadatos, el trigger `crear_perfil()` falla y se cancela
el alta, lo que confirma que no pueden existir usuarios sin perfil.

## 4. Espacio de trabajo (Google Drive)

Carpeta compartida `Feudo` con los tres integrantes como editores. Contiene todos
los archivos que no forman parte del producto publicado.

| Carpeta | Contenido |
|---|---|
| `01_Gestion` | Actas de reuniones, planificación, acuerdos del equipo y gestor de tareas |
| `02_Entregas` | Documentos entregados en cada actividad |
| `03_Diagramas` | Diagramas UML (clases, comunicación) y modelo de datos |
| `04_Diseño` | Wireframes, mockups, logo y paleta de colores |
| `05_Investigacion` | Referencias, aplicaciones similares y documentación externa |
| `06_Recursos` | Imágenes, iconos y fuentes |
| `07_Defensa` | Presentación y guion para el tribunal |

Las carpetas se numeran para mantener un orden fijo y cada una tiene un único
propósito, de modo que cualquier integrante sabe dónde guardar o buscar un archivo.

| Alternativa | Motivo de descarte |
|---|---|
| Guardar estos archivos en el repositorio | Mezcla documentos y binarios (imágenes, PDF) con el código del producto |
| OneDrive / Dropbox | Funcionalidad equivalente; Google Drive ya lo usaba todo el equipo |

## 5. Gestor de tareas (Google Sheets)

Las tareas se gestionan en la hoja `Hoja de Tareas`, dentro de `01_Gestion` en Drive.

| Columna | Valores | Uso |
|---|---|---|
| ID | T01, T02… | Referenciar tareas (por ejemplo, en commits y Pull Requests) |
| Módulo | Gestión, Infraestructura, Base de Datos, Autenticación, Comunidad, Moderación, Administración, Documentación | Categoría de la tarea |
| Tarea | Texto | Descripción concreta |
| Estado | Pendiente, En progreso, Completada | Seguimiento |
| Prioridad | Alta, Media, Baja | Orden en que se aborda |
| Importancia | Imprescindible, Recomendable, Opcional | Si es necesaria para la entrega o puede recortarse |
| Asignado | Santiago, Samuel, Pau | Responsable |
| Entrega | v1, v2 | Versión a la que pertenece |

- Todas las columnas de valores cerrados usan **desplegables con validación**, para
  evitar valores inconsistentes, y colores para identificar el estado de un vistazo.
- Un **filtro** en la cabecera, por responsable y estado, muestra en todo momento qué
  está haciendo cada integrante.

| Alternativa | Motivo de descarte |
|---|---|
| Notion | Requiere aprender otra herramienta; Sheets ya está integrado en el espacio de trabajo |
| GitHub Projects | Muy orientado al código; parte de las tareas son de gestión y documentación |
| Trello | Prioridades y categorías más limitadas en la versión gratuita |