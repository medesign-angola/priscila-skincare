# Priscila Skincare CMS

The CMS is a standalone Strapi 5 application registered in the Nx workspace as
the `cms` project. It manages catalog and editorial content; checkout, payment,
stock reservations, and transactional orders remain outside the CMS boundary.

## Requirements

- Node.js 22 or 24 LTS
- npm
- Docker Desktop, or a reachable MySQL 8 server

## Local setup

1. Start the local MySQL 8 instance in Laragon. The development configuration
   uses `127.0.0.1:3306`.
2. Create the development database and user if they do not exist:

   ```powershell
   mysql -u root -e "CREATE DATABASE IF NOT EXISTS priscila_skincare CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

3. Copy `apps/cms/.env.example` to `apps/cms/.env`.
4. Replace every placeholder secret. A suitable value can be generated with:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

5. Install the isolated CMS dependencies:

   ```powershell
   npm install --prefix apps/cms
   ```

6. Start the CMS:

   ```powershell
   npm exec nx develop cms
   ```

7. Open `http://localhost:1337/admin` and create the first administrator.

Portuguese is configured as the initial/default locale and the bootstrap adds
French on the first successful start.

## Nx targets

```powershell
npm exec nx develop cms
npm exec nx build cms
npm exec nx typecheck cms
npm exec nx generate-types cms
npm exec nx start cms
```

## Environments

- Development uses the local upload provider and the Laragon MySQL instance on
  port `3306`.
- Docker Compose remains available as an optional, reproducible alternative.
  It exposes MySQL on `3307`; set `DATABASE_PORT=3307` when using it.
- Staging and production should use managed MySQL and Cloudinary.
- Set `UPLOAD_PROVIDER=cloudinary` together with the three Cloudinary secrets.
- Configure `PUBLIC_URL`, `CORS_ORIGINS`, and database SSL for each environment.
- Never commit `.env` files or expose write/admin API tokens in the Storefront.

## Bootstrap switches

- `CMS_BOOTSTRAP_LOCALES=true` ensures that French exists alongside the default
  locale configured in Strapi.
- `CMS_BOOTSTRAP_PUBLIC_READ=true` grants public `find` and `findOne` access to
  published content. Leave it disabled until the content model is reviewed.
- `CMS_SEED_BASE_DATA=true` creates the initial size records once.

After the first controlled bootstrap, these switches can be disabled.

## Main content types

- Product
- Category
- Size
- Ingredient
- Collection
- Kit
- Review
- Testimonial
- Hero slide
- Home page
- About page
- Site settings

Product creation enforces at least five images when the image relation is
explicitly set. Home page validation prevents a product from appearing in more
than one of the featured, editorial cover, and editorial gallery contexts.

## Media

Responsive editorial media supports desktop and mobile images, video,
placeholder, alternative text, focal point coordinates, object fit, and noise.
Video transcoding is not performed by Strapi itself and should later be handled
by Cloudinary, Mux, or a dedicated FFmpeg worker.

## Deployment

The Storefront and CMS are deployed independently:

- Storefront: Vercel
- CMS: Strapi Cloud, Railway, Render, DigitalOcean, or a container host
- Database: managed MySQL 8
- Media: Cloudinary

The included `Dockerfile` builds the Strapi admin and starts the production
server. The platform must provide persistent database access and all variables
listed in `.env.example`.

## Storefront integration boundary

The next phase introduces a Strapi API client and DTO mappers in `packages/core`.
Existing mocks remain available as a fallback until each Storefront page is
validated against CMS data. REST queries must request only the required fields
and relations rather than relying on unrestricted deep population.
