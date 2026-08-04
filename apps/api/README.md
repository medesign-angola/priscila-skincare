# Priscila Skincare API

Backend transacional em .NET 10 organizado em DDD e executado como monólito modular.

## Camadas

- `packages/backend-domain`: entidades, value objects e regras de negócio puras.
- `packages/backend-application`: casos de uso e contratos de persistência/serviços externos.
- `packages/backend-infrastructure`: EF Core, MySQL, integrações com Strapi, e-mail e tokens.
- `apps/api`: HTTP, autenticação, configuração e composição das dependências.
- `apps/api-tests`: testes de domínio, aplicação e integração.

As dependências apontam sempre para dentro: `Api -> Infrastructure -> Application -> Domain`.
O projeto `Domain` não referencia ASP.NET, EF Core, MySQL ou Strapi.

## Bases de dados

Uma única instância MySQL hospeda duas bases independentes:

- `priscila_cms`: administrada exclusivamente pelo Strapi.
- `priscila_app`: administrada exclusivamente pelo Entity Framework Core.

Criação local da base transacional:

```sql
CREATE DATABASE priscila_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Configure a ligação sem guardar credenciais no Git:

```powershell
$env:ConnectionStrings__ApplicationDatabase='Server=localhost;Port=3306;Database=priscila_app;User=...;Password=...;'
$env:Jwt__Secret='uma-chave-segura-com-pelo-menos-32-caracteres'
```

## Identidade do produto

- `SKU`: identificador comercial público usado por .NET, avaliações e encomendas.
- `documentId`: identificador interno usado apenas nas relações do Strapi.
- `slug`: endereço amigável usado pelo Storefront.

O SKU deve ser tratado como imutável depois de existir uma avaliação ou encomenda.

## Nx

```powershell
npm.cmd exec -- nx run api:build
npm.cmd exec -- nx run api:serve
npm.cmd exec -- nx run api-tests:test
npm.cmd exec -- nx run api:migration-add --name=NomeDaMigracao
npm.cmd exec -- nx run api:database-update
```

O comando `database-update` aplica as migrações apenas na base indicada por
`ConnectionStrings__ApplicationDatabase`. Ele nunca deve apontar para `priscila_cms`.

O endpoint inicial de diagnóstico é `GET /api/v1/health`.

## Autenticação local

Endpoints disponíveis:

- `POST /api/v1/auth/otp/request`
- `POST /api/v1/auth/otp/verify`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/customers/me`
- `PUT /api/v1/customers/me`

O refresh token é rotativo e fica num cookie `HttpOnly`; o Storefront nunca
recebe esse segredo através de JavaScript.

### Envio do OTP por Gmail

Em desenvolvimento, o SMTP já está configurado para `smtp.gmail.com`, porta
`587`, com STARTTLS. A palavra-passe de aplicação nunca deve entrar no Git.
Guarde-a no cofre local do .NET usando os 16 caracteres sem os espaços exibidos
pelo Google:

```powershell
dotnet user-secrets set "Email:Password" "<PALAVRA-PASSE-DE-APLICACAO>" --project apps/api/PriscilaSkincare.Api.csproj
```

O e-mail acompanha o idioma ativo do Storefront (`pt` ou `fr`), inclui versão
HTML responsiva, alternativa em texto simples e a imagem da marca incorporada.
Para voltar temporariamente ao OTP no terminal, defina
`Email__DeliveryMode=Log`.

O Storefront usa `http://localhost:5041/api/v1` por padrão. Em ambientes
publicados, defina `window.__PRISCILA_SKINCARE_CONFIG__.apiUrl` antes da
inicialização da aplicação.

## Moradas do cliente

As moradas pertencem à base `priscila_app` e nunca ao Strapi. Endpoints autenticados:

- `GET /api/v1/customers/me/addresses`
- `POST /api/v1/customers/me/addresses`
- `PUT /api/v1/customers/me/addresses/{addressId}`
- `PUT /api/v1/customers/me/addresses/{addressId}/default`
- `DELETE /api/v1/customers/me/addresses/{addressId}`

Cada cliente pode guardar até cinco moradas. A primeira torna-se principal
automaticamente e, ao remover a principal, outra morada é promovida. Uma
encomenda futura deve guardar uma cópia da morada escolhida, não apenas o seu ID.

## Avaliações

A API .NET é a fonte transacional das avaliações e o Strapi é a interface de
moderação. Endpoints:

- `POST /api/v1/reviews` (autenticado)
- `GET /api/v1/reviews/mine/{sku}` (autenticado)
- `GET /api/v1/reviews/products/{sku}` (público; apenas publicadas)
- `GET /api/v1/reviews/summary` (público)
- `POST /api/v1/integrations/strapi/reviews/{reviewId}/moderation` (interno)

API e CMS devem compartilhar o mesmo `REVIEW_INTEGRATION_SECRET`, com pelo menos
32 caracteres. No CMS, configure também `APPLICATION_API_URL`. Uma edição feita
pelo cliente volta a avaliação para `pending`. Falhas ao espelhar a avaliação no
Strapi são registradas, mas não descartam a avaliação já guardada na API.

## Projeção administrativa de clientes

Os clientes continuam pertencendo à base `priscila_app`. Após autenticação,
renovação de sessão ou atualização do perfil, a API envia uma projeção de
consulta ao Strapi. No CMS, a coleção **Clientes** e os dados das avaliações são
somente leitura; apenas o estado de moderação pode ser alterado.

O endpoint interno `POST /api/internal/customers/sync` utiliza o mesmo
`REVIEW_INTEGRATION_SECRET`. Falhas nessa projeção não bloqueiam o login.

## Proteção do OTP

Além do intervalo por e-mail, a API limita cada endereço IP a cinco pedidos de
código em dez minutos e quinze tentativas de verificação em cinco minutos. Ao
exceder o limite, a API responde `429` com o código `rate_limit_exceeded`.
