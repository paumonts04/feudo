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