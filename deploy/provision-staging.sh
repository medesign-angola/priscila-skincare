#!/bin/sh
set -eu

workspace_dir="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
env_file="${1:-${workspace_dir}/.env.staging}"
compose_file="${workspace_dir}/docker-compose.staging.yml"

if [ ! -f "$env_file" ]; then
  echo "Nao foi encontrado ${env_file}." >&2
  echo "Execute primeiro: sh ./deploy/generate-staging-credentials.sh" >&2
  exit 1
fi

compose() {
  docker compose --env-file "$env_file" -f "$compose_file" "$@"
}

env_value() {
  key="$1"
  sed -n "s/^${key}=//p" "$env_file" | tail -n 1
}

require_real_value() {
  key="$1"
  value="$(env_value "$key")"

  case "$value" in
    ''|change-me*|generate-at-least-*|key-1,key-2,key-3,key-4|*example.com*)
      echo "Configure ${key} com um valor real em ${env_file}." >&2
      exit 1
      ;;
  esac
}

for key in \
  API_DOMAIN CMS_DOMAIN STOREFRONT_ORIGIN \
  MYSQL_ROOT_PASSWORD APP_DB_PASSWORD CMS_DB_PASSWORD \
  PAYMENTS_DB_PASSWORD NOTIFICATIONS_DB_PASSWORD \
  JWT_SECRET AUTH_HASH_SECRET INTEGRATION_SECRET \
  PAYMENTS_INTERNAL_API_KEY NOTIFICATIONS_INTERNAL_API_KEY \
  STRAPI_APP_KEYS STRAPI_API_TOKEN_SALT STRAPI_ADMIN_JWT_SECRET \
  STRAPI_TRANSFER_TOKEN_SALT STRAPI_JWT_SECRET STRAPI_ENCRYPTION_KEY
do
  require_real_value "$key"
done

email_provider="$(env_value EMAIL_PROVIDER)"
email_delivery_mode="$(env_value EMAIL_DELIVERY_MODE)"
if [ "$email_provider" = "Smtp" ] || [ "$email_delivery_mode" = "Smtp" ]; then
  for key in SMTP_HOST SMTP_USERNAME SMTP_PASSWORD SMTP_FROM_EMAIL
  do
    require_real_value "$key"
  done
fi

echo "1/7 Validando a configuracao do Docker Compose..."
compose config >/dev/null

if [ "${SKIP_PULL:-0}" != "1" ]; then
  echo "2/7 Atualizando as imagens dos servicos autonomos..."
  compose pull payments notifications
else
  echo "2/7 Atualizacao das imagens ignorada por SKIP_PULL=1."
fi

echo "3/7 Iniciando o MySQL sem remover o volume existente..."
compose up -d --force-recreate mysql

echo "4/7 Aguardando o MySQL aceitar ligacoes..."
attempt=0
until compose exec -T mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqladmin ping --protocol=socket -uroot --silent' >/dev/null 2>&1
do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then
    echo "O MySQL nao ficou disponivel dentro do tempo esperado." >&2
    compose logs --tail=100 mysql
    exit 1
  fi
  sleep 2
done

echo "5/7 Garantindo bases, utilizadores e permissoes..."
compose exec -T mysql sh /docker-entrypoint-initdb.d/01-create-databases.sh

echo "6/7 Aplicando as migrations da API principal..."
compose --profile migration run --rm api-migrate

echo "7/7 Construindo e iniciando API, CMS, pagamentos e notificacoes..."
compose up -d --build --remove-orphans

echo "Estado final dos containers:"
compose ps

echo "Provisionamento concluido. Payments e Notifications aplicam as suas migrations na inicializacao."
