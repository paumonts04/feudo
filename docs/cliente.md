# Cliente web (React + Vite)

### React + Vite en `client/`
**Qué:** la web se hace con React y se crea y ejecuta con Vite, en la carpeta `client/`.
Se partió de la plantilla oficial, sin los recursos de ejemplo.

**Por qué:** React es el estándar de componentes que conoce el equipo; Vite arranca al
instante y recarga en caliente. La carpeta propia deja sitio para la app móvil de la v2.

**Descartado:** Create React App (abandonado); Next.js (orientado a servidor, innecesario
sin backend); Angular/Vue (menos experiencia del equipo).

### ESLint
**Qué:** linter con la configuración por defecto de Vite.

**Por qué:** avisa de errores y malas prácticas (como un mal uso de los hooks) antes de ejecutar.

**Descartado:** OxLint (más reciente y con menos reglas; la velocidad no importa a este tamaño).

### Conexión con `supabase-js`
**Qué:** librería oficial `@supabase/supabase-js`. El cliente se crea una sola vez en
`src/lib/supabaseClient.js` y se importa desde toda la app.

**Por qué:** gestiona consultas, sesión, token y llamadas `rpc`. Una única instancia
evita sesiones duplicadas.

### Variables de entorno
**Qué:** `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` van en `client/.env.local`,
que no se sube. `client/.env.example` tiene los nombres sin valores.

**Por qué:** Vite solo expone al cliente las variables con prefijo `VITE_`. Solo se usa la
clave pública: los datos los protege RLS. La clave `service_role` nunca se usa en el cliente.

### Navegación con React Router
**Qué:** `react-router-dom` gestiona las pantallas (login, registro, foro, administración).

**Por qué:** cada pantalla tiene su URL: se puede recargar, compartir y usar el botón atrás.

**Descartado:** cambiar pantallas con `useState` (sin URLs); TanStack Router (menos extendido).

### Sesión compartida con un contexto de React
**Qué:** `src/context/` (`AuthContext.js`, `AuthProvider.jsx` y `useAuth.js`) escucha `supabase.auth.onAuthStateChange` y comparte
la sesión con toda la app mediante el hook `useAuth()`.

**Por qué:** cualquier componente sabe si hay usuario sin llamar a Supabase, y la interfaz
reacciona sola al iniciar o cerrar sesión. El estado `cargando` evita mandar al login a
alguien con sesión mientras Supabase la recupera. Se separa en tres archivos porque la
recarga en caliente de Vite exige que los `.jsx` exporten solo componentes.

**Descartado:** consultar la sesión en cada componente (código repetido); Redux o Zustand
(dependencia innecesaria para un único estado global).

### Rutas protegidas
**Qué:** `RutaProtegida` redirige a `/login` si no hay sesión y `RutaInvitado` redirige a `/`
si ya la hay (login y registro). Las rutas usan layouts con `<Outlet />`.

**Por qué:** mejora la experiencia de usuario. No es una medida de seguridad: aunque se
salte la redirección, sin sesión las políticas RLS no devuelven datos.

**Descartado:** comprobar la sesión dentro de cada página (código repetido).

### Registro
**Qué:** formulario que llama a `supabase.auth.signUp` enviando el `nombre` en los metadatos;
el perfil lo crea el trigger `crear_perfil()`.

**Por qué:** el alta y el perfil se crean en una sola operación en la base de datos. La
validación del formulario solo da feedback rápido; la regla real (nombre único de 3 a 30
caracteres) está en la base de datos.

**Descartado:** insertar el perfil desde React tras el registro (dos operaciones que pueden
quedar a medias).

### Confirmación por email desactivada
**Qué:** en Supabase Auth está desactivada la opción "Confirm email": el usuario inicia
sesión nada más registrarse.

**Por qué:** el servidor de correo incluido en Supabase solo permite enviar unos pocos
emails por hora, insuficiente para desarrollar y probar. El formulario ya contempla el caso
de confirmación activada, por lo que se puede activar más adelante sin cambiar código.

**Descartado:** configurar un proveedor de correo propio (SMTP), innecesario en la v1.
