# Feudo · Documentación técnica

Autores: Santiago Vivero, Samuel Izquierdo, Pau Montes

Aquí se recogen las **decisiones técnicas** del proyecto y su justificación. El detalle
de cómo funciona cada parte está en los comentarios del propio código y, para la base
de datos, en `database/schema.sql`.

| Documento | Contenido |
|---|---|
| [gestion.md](gestion.md) | Git y GitHub, ramas, commits, licencia, Drive y gestor de tareas |
| [arquitectura.md](arquitectura.md) | React + Supabase sin backend, autenticación y roles |
| [base-de-datos.md](base-de-datos.md) | Tablas, políticas RLS y funciones SQL |
| [cliente.md](cliente.md) | Aplicación web React + Vite |

## Cómo documentar una decisión
Solo se documenta lo que necesita un **porqué**: una tecnología, una librería, una forma
de organizar el código o una regla de seguridad. Cada decisión sigue este formato:

```markdown
### Título de la decisión
**Qué:** lo que se ha hecho, en una o dos líneas.

**Por qué:** el motivo principal.

**Descartado:** alternativas consideradas y por qué no se eligieron.
```
