# LARVAZ HIPHOP — Red Social de Cultura Hip-Hop

> **UNA COMUNIDAD. TODOS LOS ELEMENTOS. UN MISMO LUGAR.**

Plataforma web progresiva (PWA) para la cultura hip-hop: MC, DJ, Breaking, Graffiti y Beatmaking conviven en un único muro comunitario compartido.

---

## ✅ Estado Actual

**Versión**: 1.0.0 (Primera versión funcional)
**Modo**: Demostración con datos locales + integración Supabase preparada

---

## 🚀 Instalación y Ejecución Local

### Requisitos previos
- Node.js v18+ (incluido v22 verificado)
- npm v9+

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-org/larvaz-hiphop.git
cd larvaz-hiphop

# 2. Instalar dependencias
npm install

# 3. Copiar y configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales de Supabase

# 4. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

---

## 🔧 Variables de Entorno (.env.local)

```env
# Supabase (https://app.supabase.com → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# URL base de la aplicación
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Proveedor de aportes voluntarios (opcional)
# Opciones: none | stripe | mercadopago
NEXT_PUBLIC_DONATION_PROVIDER=none
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

**Sin estas variables, la aplicación funciona en modo demostración** con datos locales y un selector de perfil de prueba.

---

## ☁️ Configurar Supabase (Para Producción Real)

### 1. Crear proyecto en Supabase
1. Ve a [app.supabase.com](https://app.supabase.com) y crea un proyecto.
2. Copia la **URL** y la **Anon Key** desde `Project Settings → API`.

### 2. Ejecutar migraciones

```bash
# Opción A: Desde el Editor SQL de Supabase
# Copia y ejecuta el contenido de:
# supabase/migrations/20261020000000_initial_schema.sql

# Opción B: Con Supabase CLI
npm install -g supabase
supabase login
supabase link --project-ref tu-project-id
supabase db push
```

### 3. Cargar datos de prueba (opcional)

En el Editor SQL de Supabase, ejecuta el contenido de `supabase/seed.sql`.

> ⚠️ Los datos del seed son **perfiles y publicaciones de demostración**, no usuarios reales.

### 4. Configurar autenticación
- En Supabase: `Authentication → Email → Enable Email Provider`
- Configura las URLs de redirección: `http://localhost:3000/**`
- Para producción: agrega tu dominio en `Authentication → URL Configuration`

---

## 📁 Estructura del Proyecto

```
src/
├── app/                     # Next.js App Router - Rutas y páginas
│   ├── layout.tsx           # Layout raíz con PWA y Provider
│   ├── page.tsx             # / — Feed principal
│   ├── explorar/            # /explorar — Búsqueda y descubrimiento
│   ├── crear/               # /crear — Publicar enlace externo
│   ├── publicacion/[id]/    # /publicacion/[id] — Detalle de post
│   ├── artista/[username]/  # /artista/[username] — Perfil público
│   ├── eventos/             # /eventos — Agenda y creación de eventos
│   │   └── [slug]/          # /eventos/[slug] — Detalle del evento
│   ├── notificaciones/      # /notificaciones
│   ├── guardados/           # /guardados — Posts guardados
│   ├── apoyar-larvaz/       # /apoyar-larvaz — Aportes voluntarios
│   ├── configuracion/       # /configuracion — Edición de perfil
│   ├── login/               # /login — Inicio de sesión
│   ├── registro/            # /registro — Crear cuenta
│   ├── admin/               # /admin — Panel de moderación (role-protected)
│   ├── privacidad/          # /privacidad — Política de privacidad
│   ├── terminos/            # /terminos — Términos de uso
│   ├── normas/              # /normas — Normas comunitarias
│   └── api/
│       └── metadata/        # POST /api/metadata — Extractor SSRF-safe
├── components/
│   ├── layout/              # AppLayout, SidebarLeft, SidebarRight, Navbar, BottomNav
│   ├── feed/                # FeedFilters, PostCard, MediaEmbed
│   └── common/              # Logo, ReportModal
├── context/
│   └── AppContext.tsx       # Estado global de la aplicación
├── lib/
│   ├── data-store.ts        # Tienda de datos en memoria con localStorage
│   ├── ssrf-validator.ts    # Protección SSRF para URLs externas
│   ├── metadata-fetcher.ts  # oEmbed + OpenGraph fetcher con timeout
│   └── supabase/
│       └── client.ts        # Cliente Supabase browser con check de configuración
├── types/
│   └── index.ts             # TypeScript types del dominio
public/
├── manifest.json            # PWA Web App Manifest
├── sw.js                    # Service Worker (offline + cache estático)
├── offline.html             # Página offline PWA
└── icons/                   # SVG icons 192 y 512
supabase/
├── migrations/              # SQL versionado con schema + RLS
└── seed.sql                 # Datos de demostración identificados
```

---

## 🗺️ Rutas Implementadas

| Ruta | Descripción | Estado |
|------|-------------|--------|
| `/` | Feed principal con filtros | ✅ Funcional |
| `/explorar` | Búsqueda multi-criterio | ✅ Funcional |
| `/crear` | Publicar enlace externo | ✅ Funcional |
| `/publicacion/[id]` | Detalle de publicación | ✅ Funcional |
| `/artista/[username]` | Perfil público | ✅ Funcional |
| `/eventos` | Agenda + creación | ✅ Funcional |
| `/eventos/[slug]` | Detalle de evento | ✅ Funcional |
| `/notificaciones` | Centro de notificaciones | ✅ Funcional |
| `/guardados` | Posts guardados (privados) | ✅ Funcional |
| `/apoyar-larvaz` | Aportes voluntarios | ✅ Funcional |
| `/configuracion` | Editar perfil propio | ✅ Funcional |
| `/login` | Inicio de sesión | ✅ Preparado para Supabase |
| `/registro` | Registro de cuenta | ✅ Preparado para Supabase |
| `/admin` | Panel de moderación | ✅ Role-protected |
| `/privacidad` | Política de privacidad | ✅ Borrador |
| `/terminos` | Términos de uso | ✅ Borrador |
| `/normas` | Normas comunitarias | ✅ Borrador |

---

## 🎨 Sistema de Diseño

**Paleta:**
- Fondo: `#0A0A0A` | Superficies: `#151515 / #202020`
- Verde Ácido: `#C6FF00` | Magenta: `#FF2D95` | Naranja: `#FF5A1F` | Cian: `#00D9FF`

**Tipografía:** Bebas Neue (display) + Inter (interfaz)

**Diseño:** Mobile-first, 3 columnas en desktop (sidebar izquierdo + feed central + sidebar derecho)

---

## 📱 PWA

- `public/manifest.json` — Web App Manifest con tema `#C6FF00`
- `public/sw.js` — Service Worker con caché estático + fallback offline
- `public/offline.html` — Página de sin conexión estilizada
- `public/icons/` — Iconos SVG 192x192 y 512x512

---

## 🔒 Seguridad

- **SSRF Prevention**: `src/lib/ssrf-validator.ts` bloquea IPs privadas, localhost, link-local y rangos internos
- **RLS Policies**: Supabase Row Level Security en todas las tablas
- **Sanitización**: Texto externo sanitizado antes de renderizar (no se inyecta HTML arbitrario)
- **Roles en servidor**: El panel `/admin` verifica permisos en el componente; en producción con Supabase, las funciones RPC verifican el rol en PostgreSQL
- **No secrets en browser**: Solo `NEXT_PUBLIC_*` se expone al cliente

---

## 🔌 Funcionalidades Pendientes de Credenciales Externas

| Función | Estado | Qué necesita |
|---------|--------|--------------|
| Registro / Login real | ⏳ | Credenciales Supabase en `.env.local` |
| Sesiones persistentes | ⏳ | Supabase Auth + middleware |
| Subida de imágenes propias | ⏳ | Supabase Storage activado |
| Feed personalizado desde DB | ⏳ | Supabase conectado |
| Notificaciones en tiempo real | ⏳ | Supabase Realtime |
| Aportes voluntarios | ⏳ | Stripe o MercadoPago credentials |
| Webhooks de pagos | ⏳ | `STRIPE_WEBHOOK_SECRET` |

---

## 🧪 Modo Demostración

Sin Supabase configurado, la app usa un **data store en memoria con localStorage** que incluye:
- 5 perfiles de artistas de prueba (admin, graffitero, DJ, MC, bboy)
- 4 publicaciones con metadatos de YouTube, SoundCloud, Spotify y Vimeo
- 3 eventos culturales próximos
- Selector de perfil en la barra lateral para cambiar de usuario

---

## 📦 Deploy en Vercel

```bash
npm install -g vercel
vercel --prod
```

Configura las variables de entorno en el dashboard de Vercel bajo `Settings → Environment Variables`.

---

*LARVAZ HIPHOP — Una Comunidad. Todos los Elementos. Un Mismo Lugar.*
