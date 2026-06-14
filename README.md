# Nexo · Control de finanzas personales

Web app para registrar gastos e ingresos (por **foto de ticket**, **voz** o manualmente),
controlar límites de presupuesto, visualizar gráficas, fijar objetivos de ahorro
compartidos y obtener recomendaciones de IA.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (Radix)
- **Supabase** (PostgreSQL, Storage) como backend
- **NextAuth.js** (v4) con adaptador de Supabase para la autenticación
- **OpenAI** (GPT-4o Vision para tickets, Whisper para voz)
- **Recharts** para las gráficas

## Requisitos previos

- Node.js 18.18+ (recomendado 20+)
- Una cuenta de [Supabase](https://supabase.com) (plan gratis)
- Credenciales de **Google OAuth** ([Google Cloud Console](https://console.cloud.google.com/apis/credentials))
- Una API key de [OpenAI](https://platform.openai.com/api-keys)
- **Git** (para subir a GitHub y desplegar en Vercel) — [descargar](https://git-scm.com/downloads)

---

## 1. Instalación local

```bash
npm install
cp .env.example .env.local   # En Windows PowerShell: Copy-Item .env.example .env.local
```

Rellena `.env.local` con tus claves (ver sección **Variables de entorno**).

```bash
npm run dev
```

Abre http://localhost:3000.

---

## 2. Configurar Supabase

1. Crea un proyecto nuevo en Supabase.
2. Ve a **SQL Editor** y ejecuta, **en orden**, el contenido de la carpeta
   [`supabase/migrations/`](supabase/migrations):
   - `0000_next_auth.sql` — esquema de autenticación que requiere NextAuth
   - `0001_schema.sql` — tablas de la app
   - `0002_rls.sql` — políticas de seguridad (RLS)
   - `0003_storage.sql` — bucket privado para los tickets
3. **Importante:** ve a **Settings → API → Exposed schemas** y añade `next_auth`
   a la lista (junto a `public`). Sin esto el adaptador de NextAuth no funciona.
4. Copia en tu `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` (Settings → API → `service_role`, **secreto**)
   - `SUPABASE_JWT_SECRET` (Settings → API → JWT Settings → JWT Secret)

## 3. Configurar Google OAuth

1. En Google Cloud Console crea unas credenciales de tipo **OAuth client ID → Web application**.
2. **Authorized redirect URIs:**
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Producción: `https://TU-PROYECTO.vercel.app/api/auth/callback/google`
3. Copia `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` a `.env.local`.

## 4. NextAuth secret

```bash
# Genera un secreto y pégalo en NEXTAUTH_SECRET
openssl rand -base64 32
```

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXTAUTH_URL` | URL pública de la app (`http://localhost:3000` en local). |
| `NEXTAUTH_SECRET` | Secreto para firmar sesiones. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Credenciales de Google OAuth. |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima (pública) de Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servicio (**secreta**, solo servidor). |
| `SUPABASE_JWT_SECRET` | JWT secret del proyecto (para RLS con NextAuth). |
| `OPENAI_API_KEY` | API key de OpenAI (tickets por foto y voz). |

---

## Despliegue en Vercel (gratis)

1. Sube el proyecto a un repositorio de **GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Nexo: configuración inicial"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/nexo.git
   git push -u origin main
   ```
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repo.
   Vercel detecta Next.js automáticamente (no hay que tocar build settings).
3. En **Settings → Environment Variables** añade **todas** las variables del
   `.env.example` con tus valores reales.
   - Pon `NEXTAUTH_URL` con la URL final del proyecto: `https://TU-PROYECTO.vercel.app`
4. **Deploy**. Tu app quedará en `https://TU-PROYECTO.vercel.app` (dominio gratuito de Vercel).
5. Vuelve a **Google Cloud Console** y añade la redirect URI de producción
   (`https://TU-PROYECTO.vercel.app/api/auth/callback/google`).

> Tras el primer deploy, si cambias `NEXTAUTH_URL` o las redirect URIs, vuelve a
> desplegar (**Redeploy**) para que tomen efecto.

---

## Estructura del proyecto

```
src/
  app/                 # Rutas (App Router)
    api/auth/[...nextauth]/route.ts
    layout.tsx
    page.tsx           # Landing
  components/
    ui/                # Componentes shadcn/ui
    theme-provider.tsx
  lib/
    auth.ts            # Configuración de NextAuth
    constants.ts       # Categorías, umbrales de alerta
    openai.ts          # Cliente OpenAI
    supabase/          # Clientes de Supabase (server / browser)
  types/               # Tipos de DB y NextAuth
  middleware.ts        # Gate de rutas protegidas
supabase/
  migrations/          # SQL: esquema, RLS y storage
```

## Scripts

| Comando | Acción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servir el build |
| `npm run lint` | Linter |

## Estado

Configuración base lista. Las funcionalidades (registro por foto/voz, gráficas,
límites, objetivos, modo vacaciones, recomendaciones IA) se desarrollan una a una
sobre esta base.
