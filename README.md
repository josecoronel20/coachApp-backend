# CoachApp Backend

API REST construida con Express + Prisma que sirve al frontend de GymBro Coach. Gestiona autenticación, administración de entrenadores/atletas y sincronización de sesiones de entrenamiento.

## Stack principal
- **Node.js + Express 5** como framework HTTP
- **TypeScript** (compilado a `dist/`)
- **Prisma ORM** apuntando a PostgreSQL (Supabase en producción)
- **JWT + cookies HTTP-only** para autenticación de entrenadores
- **bcryptjs** para hash de contraseñas

## Arquitectura
```
backend/
├─ src/
│  ├─ app.ts                  # Bootstrap express, CORS, middlewares y rutas
│  ├─ routes/                 # Definición de endpoints agrupados
│  ├─ controllers/            # Lógica de negocio (auth, coach, athlete)
│  ├─ middleware/             # Middleware de auth (JWT + cookies)
│  └─ data/                   # Seeds/ejemplos (no usados en producción)
├─ prisma/
│  └─ schema.prisma           # Modelado de Coach, Athlete y sesiones
├─ dist/                      # Código compilado (npm run build)
└─ README.md
```

### Modelos Prisma relevantes
- `Coach`: credenciales del entrenador, relación 1:N con atletas
- `Athlete`: datos personales, configuración (peso, notas, repsTracked)
- `RoutineDay`: rutina por día (índice 0-based), relación con ejercicios
- `Exercise`: definición (sets, rango, notas coach/atleta)
- `ExerciseHistory`: historial limitado a 5 registros por ejercicio
- `Session` y `SessionExercise`: resumen de entrenamientos guardados

## Flujo de autenticación
1. `POST /api/auth/login` — valida credenciales, genera JWT y lo setea en cookie `token` (`httpOnly`, `secure`, `sameSite=none`, expira 1h).
2. `GET /api/auth/isAuthenticated` — verifica cookie, devuelve datos mínimos del coach.
3. `POST /api/auth/logout` — elimina cookie.
4. `POST /api/auth/register` — crea un entrenador (valida duplicados y confirmación).

Las rutas de coach/athletes esperan la cookie `token` (en producción se protege con `credentials: "include"`).

## Rutas y controladores

### `/api/coach`
- `GET /info` — devuelve datos del coach autenticado.
- `POST /newAthlete` — crea un atleta asociado al coach autenticado (valida teléfono único).
- `GET /getAthleteInfo/:id` — detalle de un atleta con rutina transformada para el frontend.
- `GET /getAllAthletes` — listado simplificado (id, name, phone, etc.).

### `/api/athletes`
- `GET /:id` — versión para el lado atleta; incluye rutina con historial más reciente.
- `POST /saveSession` — guarda snapshot de sesión:
  - crea `Session`, `SessionExercise` y `ExerciseHistory` dentro de una transacción
  - mantiene solo los 5 historiales más nuevos por ejercicio
  - actualiza notas del atleta si vienen en el payload
- `PUT /updateBodyWeight` — actualiza peso corporal.
- `PUT /updateRepsTracked` — activa/desactiva tracking manual de reps.

### `/api/auth`
- `POST /login`
- `POST /register`
- `POST /logout`
- `GET /isAuthenticated`

### `/api/protected`
Rutas varias para pruebas (ver `src/controllers/protected.ts`).

## CORS y cookies
Configurado en `src/app.ts`:
```ts
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://gymbrocoach.vercel.app",
    "https://coachapp-backend.onrender.com"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
```
Asegúrate de añadir el dominio donde despliegues el backend/frontend.

## Variables de entorno (backend/.env)
```
DATABASE_URL=postgresql://...     # URL de PostgreSQL (Supabase pooler recomendado)
JWT_SECRET=tu_clave_segura        # Usada para firmar tokens
PORT=3001                         # Solo para desarrollo local
```
> En producción (Render, Vercel, etc.) define estas variables en el panel de la plataforma.

## Scripts
```bash
npm install        # Instala dependencias
npm run dev        # tsx + nodemon (hot reload en src/)
npm run build      # Compila a dist/
npm start          # Ejecuta dist/app.js
npx prisma db push # Sincroniza schema con la BD
npx prisma migrate dev --name init  # (opcional) genera migración
```

## Flujo de sincronización de sesiones
1. El frontend envía `sessionProgress` (reps, peso, notas) desde `saveSession`.
2. `athleteController.saveSession` valida y ejecuta transacción:
   - crea registro en `Session`
   - persiste cada ejercicio en `SessionExercise`
   - copia datos en `ExerciseHistory` (para historial semanal)
   - actualiza notas del atleta
   - borra historiales viejos (>5)
3. El frontend refresca los datos llamando a `GET /api/athletes/:id` y actualiza el store.

## Integración con Supabase/PostgreSQL
- Usa **Transaction Pooler** (puerto 6543) o **Session Pooler** (5432) según tu plan/red.
- Prisma necesita que la base esté accesible al correr `db push`/`migrate`.
- Recuerda configurar reglas RLS si usas Supabase (o deshabilitarlas si no las necesitas aún).

## Despliegue sugerido
- **Render.com**: apto para Express long-running. Configura `Build Command: npm install && npm run build`, `Start Command: npm start`.
- **Vercel (opcional)**: requiere refactor a serverless (exportar app como handler y usar `@vercel/node`). Ver notas en frontend README.

## Próximos pasos recomendados
- Agregar middleware `authMiddleware` en producción para proteger rutas sensibles.
- Manejo de errores unificado con códigos personalizados.
- Tests unitarios/integración (Jest, Supertest) para controladores críticos.
- Logs estructurados (p.ej. pino) y observabilidad.
- Webhooks o jobs para recordatorios de pagos usando `paymentDate`.
