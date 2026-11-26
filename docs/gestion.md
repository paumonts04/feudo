# Gestión del proyecto

### Control de versiones: Git y GitHub
**Qué:** el código está en GitHub (`paumonts04/feudo`), con los tres integrantes como
colaboradores. El repositorio anterior (con backend Express) se renombró a `feudo-old`
y se archivó.

**Por qué:** Git permite trabajar en paralelo y volver a versiones anteriores; GitHub
centraliza el código y deja constancia del trabajo de cada integrante. Archivar en vez
de borrar conserva el trabajo previo sin riesgo.

**Descartado:** GitLab/Bitbucket (equivalentes, el equipo ya conocía GitHub);
compartir carpetas (sin historial ni control de conflictos).

### Repositorio público
**Qué:** el repositorio es público.

**Por qué:** el profesorado y el tribunal pueden consultar el código y su historial sin
invitaciones. Es seguro porque no contiene credenciales (`.env.local` está en
`.gitignore`) y la protección de los datos depende de las políticas RLS, no de ocultar
el código.

**Descartado:** repositorio privado (obliga a invitar a cada evaluador).

### Estructura del repositorio
| Ruta | Contenido |
|---|---|
| `client/` | Aplicación web React + Vite |
| `database/schema.sql` | Esquema completo de Supabase, para recrear la base de datos desde cero |
| `docs/` | Documentación técnica |
| `AGENTS.md`, `CLAUDE.md` | Contexto para los asistentes de IA del equipo |
| `README.md`, `LICENSE` | Presentación del proyecto y licencia |

`.gitignore` excluye `node_modules/`, `dist/`, los logs y los archivos `.env`
(se mantiene `.env.example` como plantilla sin valores).

### Licencia MIT
**Qué:** el proyecto se publica bajo licencia MIT, a nombre de los tres integrantes.

**Por qué:** permite usar y modificar el código manteniendo la autoría.

**Descartado:** GPL-3.0 (obliga a publicar las versiones derivadas con la misma licencia);
sin licencia (impide cualquier reutilización).

### Commits: Conventional Commits
**Qué:** mensajes con tipo y ámbito opcional: `feat(client):`, `fix(database):`,
`docs:`, `chore:`… en español.

**Por qué:** historial legible en el que se identifica el tipo de cada cambio.

### Flujo de ramas: Git Flow simplificado
**Qué:**
- `main`: solo versiones entregadas.
- `develop`: integración y rama por defecto.
- `feature/<nombre>`: una por funcionalidad, creada desde `develop`. Al terminar se
  integra con `git merge` y se borra.

La revisión del código se hace en común, sin Pull Requests obligatorias.

**Por qué:** protege la versión entregada y aísla cada funcionalidad mientras se desarrolla.

**Descartado:** trabajar todos en `main` (riesgo de romper la versión estable);
Git Flow completo con `release/*` y `hotfix/*` (excesivo para dos entregas);
trunk-based (requiere tests automáticos); Pull Requests obligatorias (pasos de gestión
innecesarios para tres personas que trabajan juntas).

**Incidencia:** se subió por error un proyecto Next.js a `main`. Como no había ninguna
entrega, se restableció `main` a su commit inicial (`git reset --hard` +
`git push --force-with-lease`) y se acordó crear siempre las ramas desde `develop`.

### Espacio de trabajo: Google Drive
**Qué:** carpeta compartida `Feudo` con los archivos que no son código.

| Carpeta | Contenido |
|---|---|
| `01_Gestion` | Actas, planificación y gestor de tareas |
| `02_Entregas` | Documentos entregados |
| `03_Diagramas` | Diagramas UML y modelo de datos |
| `04_Diseño` | Wireframes, mockups, logo y paleta |
| `05_Investigacion` | Referencias y aplicaciones similares |
| `06_Recursos` | Imágenes, iconos y fuentes |
| `07_Defensa` | Presentación y guion para el tribunal |

**Por qué:** carpetas numeradas con un único propósito: todos saben dónde guardar y buscar.

**Descartado:** guardarlo en el repositorio (mezcla binarios con el código);
OneDrive/Dropbox (equivalentes, el equipo ya usaba Drive).

### Gestor de tareas: Google Sheets
**Qué:** `Hoja de Tareas` en `01_Gestion`, con las columnas ID (`T01`…), Módulo, Tarea,
Estado, Prioridad, Importancia, Asignado y Entrega (v1/v2). Los valores cerrados usan
desplegables con colores y la cabecera tiene filtro por responsable y estado.

**Por qué:** integrado en el espacio de trabajo y sin herramientas nuevas que aprender.
Los ID permiten citar la tarea en los commits.

**Descartado:** Notion (otra herramienta más); GitHub Projects (orientado solo a código);
Trello (prioridades y categorías limitadas en la versión gratuita).
