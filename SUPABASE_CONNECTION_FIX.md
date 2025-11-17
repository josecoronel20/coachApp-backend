# Solución: Error "prepared statement does not exist" en Render

## Problema
El error `prepared statement "s4" does not exist` ocurre cuando Prisma intenta usar prepared statements con el **Transaction Pooler** de Supabase (puerto 6543), que no los mantiene entre transacciones.

## Solución

### Opción 1: Usar Session Pooler (Recomendado)

Cambia la `DATABASE_URL` en Render para usar el **Session Pooler** (puerto 5432) en lugar del Transaction Pooler:

1. Ve a tu proyecto en Render → Environment
2. Busca la variable `DATABASE_URL`
3. Cambia la URL de:
   ```
   postgresql://postgres.xxx:password@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1
   ```
   
   A (Session Pooler):
   ```
   postgresql://postgres.xxx:password@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true&connection_limit=1
   ```

   O mejor aún, usa la conexión directa (sin PgBouncer):
   ```
   postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require
   ```

4. Guarda los cambios y Render redeployará automáticamente

### Opción 2: Usar Direct Connection (Alternativa)

Si el Session Pooler no está disponible, usa la conexión directa de Supabase:

1. En Supabase Dashboard → Settings → Database
2. Copia la **Connection string** (Direct connection, no pooler)
3. Actualiza `DATABASE_URL` en Render con esa URL

## Notas

- **Transaction Pooler (6543)**: No soporta prepared statements → ❌ No funciona con Prisma
- **Session Pooler (5432)**: Soporta prepared statements → ✅ Funciona con Prisma
- **Direct Connection (5432)**: Soporta prepared statements → ✅ Funciona con Prisma

## Verificación

Después de cambiar la URL, verifica que el backend inicie correctamente en Render y que las peticiones funcionen sin el error de prepared statements.

