# Base de datos (database/) · Contexto para agentes de IA

Lee primero el `AGENTS.md` de la raíz.

## Reglas
- `database/schema.sql` es la **fuente de verdad**. Todo cambio en Supabase debe
  reflejarse ahí, en el orden correcto, para poder recrear la base desde cero.
- Los cambios se ejecutan a mano en el **SQL Editor de Supabase**.
- Toda tabla nueva lleva `enable row level security` desde su creación.
- RLS sigue la **denegación por defecto**: no crees políticas que no hagan falta.
- **No crees políticas de UPDATE** en `perfiles`, `posts` ni `comentarios`: RLS no limita
  columnas y permitiría cambiar el rol, el baneo, el contenido o el autor. Las acciones
  privilegiadas se hacen con funciones `security definer`.
- Toda función `security definer` lleva `set search_path = ''` y nombres completos
  (`public.tabla`).
- Las comprobaciones de rol usan `coalesce(public.rol_actual(), 'USUARIO')`, porque sin
  sesión `rol_actual()` devuelve `null` y `null not in (...)` no es verdadero.
- Cualquier cambio se documenta en `docs/documentacion.md` (sección "Base de datos").

## Esquema actual
- Enum `rol`: `USUARIO`, `MODERADOR`, `ADMIN`.
- `perfiles`: amplía `auth.users`. Lo crea el trigger `al_registrarse` → `crear_perfil()`,
  que copia `nombre` de `raw_user_meta_data`. El rol siempre empieza en `USUARIO`.
  Sin `nombre` válido, el alta en Auth se cancela.
- `posts`, `comentarios`: con `oculto` para la moderación (se oculta, nunca se borra).
- `me_gusta`: `unique (post_id, usuario_id)`.
- Ids: `uuid` en `perfiles` (el de Auth); `bigint generated always as identity` en el resto.
- `usuario_id` tiene `default auth.uid()`.

## Políticas RLS
| Tabla | SELECT | INSERT | DELETE |
|---|---|---|---|
| `perfiles` | autenticados | — (trigger) | — |
| `posts` | no ocultos; MODERADOR/ADMIN ven todos | propio y no baneado | — |
| `comentarios` | no ocultos; MODERADOR/ADMIN ven todos | propio y no baneado | — |
| `me_gusta` | autenticados | propio y no baneado | propio y no baneado |

## Funciones
- Auxiliares: `rol_actual()`, `esta_baneado()` (sin sesión devuelve `true`).
- Moderación (MODERADOR, ADMIN): `cambiar_visibilidad_post`, `cambiar_visibilidad_comentario`.
- Administración (ADMIN; no sobre uno mismo): `cambiar_baneo`, `cambiar_rol`.

## Primer administrador
Tras registrarse desde la web, se ejecuta en el SQL Editor (que no está sujeto a RLS):
```sql
update public.perfiles set rol = 'ADMIN' where nombre = 'NOMBRE_DEL_USUARIO';
```
No se pueden crear usuarios desde Authentication → Add user: el trigger falla por
falta de `nombre`, y es el comportamiento esperado.