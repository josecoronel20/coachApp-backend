# Solución: Error "prepared statement does not exist" en Render

## Problema
El error `prepared statement "s11" does not exist` ocurre cuando Prisma intenta usar prepared statements con el **Transaction Pooler** de Supabase (puerto 6543), que no los mantiene entre transacciones.

## Solución

### ⚠️ IMPORTANTE: Cambiar DATABASE_URL en Render

**Debes cambiar la `DATABASE_URL` en Render para usar el Session Pooler o conexión directa.**

### Opción 1: Usar Session Pooler (Recomendado para producción)

1. Ve a tu proyecto en Render → **Environment**
2. Busca la variable `DATABASE_URL`
3. **Cambia el puerto de 6543 a 5432** en la URL:

   **De (Transaction Pooler - NO funciona):**
   ```
   postgresql://postgres.xxx:password@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1
   ```
   
   **A (Session Pooler - SÍ funciona):**
   ```
   postgresql://postgres.xxx:password@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true&connection_limit=1
   ```

4. **Guarda los cambios** - Render redeployará automáticamente

### Opción 2: Usar Direct Connection (Mejor para Prisma)

1. En **Supabase Dashboard** → **Settings** → **Database**
2. Busca la sección **Connection string**
3. Selecciona **Direct connection** (no pooler)
4. Copia la URL que se ve así:
   ```
   postgresql://postgres.xxx:password@db.xxx.supabase.co:5432/postgres?sslmode=require
   ```
5. Actualiza `DATABASE_URL` en Render con esa URL
6. **Guarda los cambios** - Render redeployará automáticamente

### Opción 3: Deshabilitar prepared statements (No recomendado)

Si no puedes cambiar la URL, puedes agregar este parámetro a la `DATABASE_URL`:
```
?prepared_statement_cache_size=0
```

**Ejemplo completo:**
```
postgresql://postgres.xxx:password@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1&prepared_statement_cache_size=0
```

⚠️ **Nota**: Esta opción puede afectar el rendimiento.

## Comparación de opciones

| Tipo de Conexión | Puerto | Prepared Statements | Funciona con Prisma |
|------------------|-------|-------------------|---------------------|
| Transaction Pooler | 6543 | ❌ No | ❌ No |
| Session Pooler | 5432 | ✅ Sí | ✅ Sí |
| Direct Connection | 5432 | ✅ Sí | ✅ Sí (mejor) |

## Pasos para aplicar la solución

1. ✅ Ve a Render → Tu proyecto → Environment
2. ✅ Busca `DATABASE_URL`
3. ✅ Cambia el puerto de `6543` a `5432` O usa la conexión directa de Supabase
4. ✅ Guarda los cambios
5. ✅ Espera a que Render redeploye automáticamente
6. ✅ Verifica que el backend inicie sin errores

## Verificación

Después de cambiar la URL, verifica en los logs de Render que:
- ✅ El backend inicia correctamente
- ✅ No aparecen errores de "prepared statement does not exist"
- ✅ Las peticiones funcionan correctamente

