# Priscila Skincare CMS

## Dados administrativos projetados

- **Clientes** são sincronizados pela API .NET e não podem ser editados no CMS.
- **Avaliações** são criadas pela aplicação e somente o campo **Estado da moderação** pode ser alterado.
- Produto e cliente aparecem como relações; UUID e SKU permanecem apenas como referências técnicas.
- `APPLICATION_API_URL` e `REVIEW_INTEGRATION_SECRET` devem estar configurados para devolver a decisão de moderação à API.

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
