# Deploy de staging com Docker e Nginx

Esta composição executa a API .NET, o Strapi e uma instância MySQL com duas
bases lógicas: `priscila_app` para a aplicação e `priscila_cms` para o CMS.
O Nginx instalado na VPS é responsável pelo acesso público e pelo HTTPS.

A API e o CMS são publicados apenas em `127.0.0.1`, portanto não ficam
diretamente expostos à internet:

- API: `127.0.0.1:8098`;
- Strapi: `127.0.0.1:8099`.

## Preparação da VPS

1. Instale Docker Engine, Docker Compose, Nginx e Certbot.
2. Aponte os domínios da API e do CMS para o IP público da VPS.
3. Libere apenas as portas `80` e `443` no firewall.
4. Clone o repositório e copie `.env.staging.example` para `.env.staging`.
5. Substitua todos os valores `change-me` por segredos fortes. O ficheiro real
   `.env.staging` nunca deve ser enviado ao Git.

## Primeira publicação

```bash
docker compose --env-file .env.staging -f docker-compose.staging.yml build
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d mysql cms
docker compose --env-file .env.staging -f docker-compose.staging.yml --profile migration run --rm api-migrate
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d
docker compose --env-file .env.staging -f docker-compose.staging.yml ps
```

A migração da API é explícita e deve terminar com sucesso antes da subida da
nova versão. O Strapi administra as próprias alterações de schema ao iniciar.

## Configuração do Nginx

Crie `/etc/nginx/sites-available/priscila-skincare-staging`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api-staging.example.com;

    location / {
        proxy_pass http://127.0.0.1:8098;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name cms-staging.example.com;

    client_max_body_size 100M;

    location / {
        proxy_pass http://127.0.0.1:8099;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Substitua os domínios de exemplo, habilite o ficheiro e valide o Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/priscila-skincare-staging /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Em seguida, solicite os certificados:

```bash
sudo certbot --nginx -d api-staging.example.com -d cms-staging.example.com
```

## Atualizações

```bash
git pull
docker compose --env-file .env.staging -f docker-compose.staging.yml build
docker compose --env-file .env.staging -f docker-compose.staging.yml --profile migration run --rm api-migrate
docker compose --env-file .env.staging -f docker-compose.staging.yml up -d --remove-orphans
```

O `--remove-orphans` remove o antigo container do Caddy caso ele tenha sido
criado por uma versão anterior da composição.

## Diagnóstico

```bash
docker compose --env-file .env.staging -f docker-compose.staging.yml ps
docker compose --env-file .env.staging -f docker-compose.staging.yml logs --tail 200 api
docker compose --env-file .env.staging -f docker-compose.staging.yml logs --tail 200 cms
curl http://127.0.0.1:8098/health
curl http://127.0.0.1:8099/_health
```

Os uploads do Strapi e as duas bases ficam em volumes persistentes. Antes de
produção, configure backups automáticos de `mysql_data` e `strapi_uploads`,
SMTP oficial e monitorização externa dos dois domínios.
