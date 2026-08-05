# Deploy de staging com Docker

Esta composição publica a API .NET e o Strapi através do Caddy. O MySQL fica
acessível apenas na rede privada do Docker e mantém duas bases lógicas:
`priscila_app` para a aplicação e `priscila_cms` para o Strapi.

## Preparação da VPS

1. Instale Docker Engine e o plugin Docker Compose.
2. Aponte os domínios da API e do CMS para o IP público da VPS.
3. Libere apenas as portas `80` e `443` no firewall.
4. Clone o repositório e copie `.env.staging.example` para `.env.staging`.
5. Substitua todos os valores `change-me` por segredos fortes. O ficheiro real
   `.env.staging` não deve ser enviado ao Git.

## Primeira publicação

```powershell
docker compose --env-file .env.staging -f docker-compose.staging.yml build
docker compose --env-file .env.staging -f docker-compose.staging.yml --profile migration run --rm api-migrate
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d
docker compose --env-file .env.staging -f docker-compose.staging.yml ps
```

A migração da API é intencionalmente explícita: ela deve terminar com sucesso
antes da subida da nova versão. O Strapi administra as próprias alterações de
schema ao iniciar.

## Atualizações

```powershell
git pull
docker compose --env-file .env.staging -f docker-compose.staging.yml build
docker compose --env-file .env.staging -f docker-compose.staging.yml --profile migration run --rm api-migrate
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d --remove-orphans
```

## Diagnóstico e operação

```powershell
docker compose --env-file .env.staging -f docker-compose.staging.yml ps
docker compose --env-file .env.staging -f docker-compose.staging.yml logs --tail 200 api
docker compose --env-file .env.staging -f docker-compose.staging.yml logs --tail 200 cms
```

Os uploads locais do Strapi, as duas bases e os certificados do Caddy ficam em
volumes persistentes. Antes de produção, configure backups automáticos de
`mysql_data` e `strapi_uploads`, SMTP oficial e monitorização externa dos dois
domínios.
