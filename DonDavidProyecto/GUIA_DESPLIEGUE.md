# Guía rápida: Supabase + Vercel — Licorería Don David

Referencia corta de lo que se explicó en el chat. Los pasos con más
detalle y el "por qué" de cada uno están en la conversación.

## 1. Crear el proyecto en Supabase

1. Entra a https://supabase.com → **Sign up** (o inicia sesión) → **New project**.
2. Elige un nombre (ej. `don-david-licoreria`), una contraseña para la base
   de datos (guárdala, no se puede recuperar) y la región más cercana
   (`South America (São Paulo)` es la más cercana a Perú).
3. Espera 1-2 minutos a que el proyecto termine de crearse.
4. Ve a **SQL Editor** (menú izquierdo) → **New query** → pega todo el
   contenido de `supabase/schema.sql` (de esta misma carpeta) → **Run**.
5. Ve a **Project Settings → API**. Copia:
   - **Project URL** (algo como `https://xxxxx.supabase.co`)
   - **anon public key** (una key larga)
6. Abre `script.js`, busca las líneas:
   ```js
   const SUPABASE_URL = "TU_SUPABASE_URL_AQUI";
   const SUPABASE_ANON_KEY = "TU_SUPABASE_ANON_KEY_AQUI";
   ```
   y reemplaza con tus valores reales.
7. Para editar el catálogo (agregar/quitar/cambiar precio de productos):
   **Table Editor → productos**, directo desde el dashboard de Supabase.
   No hace falta tocar código.

## 2. Subir el proyecto a GitHub (recomendado antes de Vercel)

1. Crea un repositorio nuevo en https://github.com/new (ej. `don-david-web`).
2. Desde la carpeta del proyecto:
   ```
   git init
   git add .
   git commit -m "Sitio Don David: carrito, calculadora y Supabase"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/don-david-web.git
   git push -u origin main
   ```

## 3. Desplegar en Vercel

1. Entra a https://vercel.com → **Sign up** con tu cuenta de GitHub.
2. **Add New → Project** → elige el repositorio `don-david-web`.
3. Framework Preset: **Other** (es HTML/CSS/JS sin build). Deja todo lo
   demás por defecto.
4. **Deploy**. En ~30 segundos tienes una URL pública
   (`don-david-web.vercel.app`).
5. Cada `git push` a `main` vuelve a desplegar automáticamente.

## Notas

- El sitio funciona igual de bien SIN Supabase configurado (usa el
  catálogo escrito en `script.js` como respaldo). Configurar Supabase
  es una mejora, no un requisito para que funcione.
- El número de WhatsApp está centralizado en `script.js`
  (`WHATSAPP_NUMERO`) y en `partials.js` (lo lee de esa misma constante).
