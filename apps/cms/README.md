# Priscila Skincare CMS

Strapi 5 content management application for the Priscila Skincare catalog and
editorial pages.

The complete setup, MySQL, Nx, media, environment, and deployment instructions
are documented in [`../../docs/strapi-cms.md`](../../docs/strapi-cms.md).

## Quick start

```powershell
# Start MySQL from Laragon first.
npm install --prefix apps/cms
npm exec nx develop cms
```

Open `http://localhost:1337/admin` to create the first administrator.
