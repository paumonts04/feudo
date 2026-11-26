# Feudo · Contexto para agentes de IA

Lee este archivo entero antes de hacer cualquier cambio. Si trabajas en `client/` o
`database/`, lee también el `AGENTS.md` de esa carpeta.

## El proyecto
Feudo es el proyecto final de 2º de DAM de Santiago Vivero, Samuel Izquierdo y Pau Montes.
Es una plataforma de running con conquista de territorio: cuando un usuario corre una ruta
cerrada, conquista el área que queda dentro; si otro usuario corre después por esa zona,
se la arrebata. Hay un ranking por área conquistada.

El proyecto se defiende ante un tribunal: **cada decisión técnica debe poder justificarse**
y queda documentada en `docs/` (índice en `docs/README.md`).

## Entregas
- **v1 (diciembre 2026)** — en curso: web con usuarios, roles, foro y moderación. Sin mapa ni GPS.
  - Roles: `USUARIO`, `MODERADOR`, `ADMIN`.
  - Foro: posts, comentarios y me gusta.
  - Moderador: oculta posts y comentarios (sin borrarlos) y puede volver a mostrarlos.
  - Admin: banea y desbanea usuarios y cambia roles.
- **v2 (enero – junio 2027)**: app móvil con GPS, mapa y mecánica de territorio.
  - Ruta cerrada: termina a menos de 50 m de donde empezó (ajustable).
  - Si dos usuarios conquistan la misma zona, se la queda el último.
  - Reconquistar una zona propia no suma otra vez al ranking.
  - Rutas que se cruzan a sí mismas: pendiente de decidir.

## Arquitectura (decisiones cerradas, no cambiarlas)
- **Frontend:** React + Vite, en JavaScript (no TypeScript), en la carpeta `client/`.
- **Backend:** **no hay backend propio.** Nada de Express, Next.js ni servidores.
  React habla directamente con **Supabase** mediante `@supabase/supabase-js`.
- **Autenticación:** Supabase Auth (email y contraseña).
- **Permisos:** toda la seguridad está en la base de datos (políticas RLS y funciones SQL).
  El código del cliente es público y manipulable: **nunca confíes en comprobaciones hechas
  solo en React**.
- **Base de datos:** PostgreSQL en Supabase (proyecto `feudo`, región Frankfurt).
  El esquema completo está en `database/schema.sql`.

Descartado expresamente: backend Express, Next.js, Create React App, tabla propia de
contraseñas, rol guardado en el JWT.

## Estructura del repositorio
| Ruta | Contenido |
|---|---|
| `client/` | Aplicación web React + Vite |
| `database/schema.sql` | Esquema completo de Supabase (fuente de verdad del SQL) |
| `docs/` | Documentación técnica: decisiones y su justificación, dividida por temas |
| `README.md` | Presentación del proyecto |
| `LICENSE` | Licencia MIT |

No crees carpetas nuevas en la raíz (como `src/` o `frontend/`) sin que el equipo lo decida.

## Seguridad (obligatorio)
- En el cliente solo se usa la **clave pública** de Supabase (publishable/anon).
  **Nunca** uses ni pidas la `service_role` / secret key.
- Las claves van en `client/.env.local`, que **no se sube**. `client/.env.example`
  contiene solo los nombres de las variables, sin valores.
- No subas nunca archivos `.env`, `node_modules/` ni `dist/`.

## Flujo de Git
- `main`: solo versiones entregadas. **No hagas commits directamente en `main`.**
- `develop`: rama de integración y rama por defecto.
- `feature/<nombre>`: una rama por funcionalidad, **siempre creada desde `develop`**.
  Al terminar, se integra en `develop` con `git merge` y se borra la rama.
  El equipo no usa Pull Requests obligatorias: la revisión se hace en común.
- Los cambios que solo tocan documentación pueden ir directamente a `develop`.
- Commits con **Conventional Commits** y ámbito opcional:
  `feat(client): ...`, `fix(database): ...`, `docs: ...`, `chore(client): ...`.
  Mensajes en español.

## Gestión de tareas
Las tareas están en una hoja de Google Sheets (`Hoja de Tareas`, carpeta `01_Gestion`
del Drive del equipo), con ID `T01`, `T02`... Puedes citar el ID en el commit.

## Documentación
- Solo se documentan **decisiones** (tecnología, librería, organización, regla de
  seguridad), en el archivo de `docs/` que corresponda y con el formato corto
  **Qué / Por qué / Descartado** descrito en `docs/README.md`.
- El funcionamiento del código se explica con comentarios breves en el propio código.
- Idioma de todo el proyecto (código, comentarios, documentación, interfaz): **español**.

## Estado actual (actualizar al avanzar)
- ✅ Repositorio, licencia, Drive y gestor de tareas.
- ✅ Base de datos v1 completa: tablas, RLS, trigger de perfiles y funciones de moderación
  y administración (`database/schema.sql`).
- ✅ Cliente base: Vite, `supabase-js`, `react-router-dom`, `src/lib/supabaseClient.js`.
- ⏳ Cada integrante debe crear su `client/.env.local` (ver `client/.env.example`).
- ⏳ Siguiente: login y registro (rama `feature/auth`), rutas públicas y protegidas.
- ⏳ Después: foro, moderación y panel de administración.
- ⏳ Primer ADMIN: se asigna a mano en el SQL Editor tras registrarse (ver `database/AGENTS.md`).

## Cómo arrancar
```bash
cd client
npm install
npm run dev
```
Requiere Node.js 20 o superior y `client/.env.local` con las variables de Supabase.