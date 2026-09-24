#!/bin/sh
set -eu

workspace_dir="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
env_file="${1:-${workspace_dir}/.env.staging}"
example_file="${workspace_dir}/.env.staging.example"

if ! command -v openssl >/dev/null 2>&1; then
  echo "OpenSSL e necessario para gerar as credenciais." >&2
  exit 1
fi

if [ ! -f "$env_file" ]; then
  cp "$example_file" "$env_file"
  echo "Criado ${env_file} a partir do exemplo."
fi

current_value() {
  key="$1"
  sed -n "s/^${key}=//p" "$env_file" | tail -n 1
}

needs_value() {
  value="$1"

  case "$value" in
    ''|change-me*|generate-at-least-*|key-1,key-2,key-3,key-4)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

set_value() {
  key="$1"
  value="$2"
  temporary_file="${env_file}.tmp.$$"

  if grep -q "^${key}=" "$env_file"; then
    awk -v target="$key" -v replacement="$value" '
      index($0, target "=") == 1 { print target "=" replacement; next }
      { print }
    ' "$env_file" > "$temporary_file"
    mv "$temporary_file" "$env_file"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$env_file"
  fi
}

random_hex() {
  openssl rand -hex 32
}

random_base64() {
  openssl rand -base64 32 | tr -d '\r\n'
}

generate_if_missing() {
  key="$1"
  value="$(current_value "$key")"

  if needs_value "$value"; then
    set_value "$key" "$(random_hex)"
    echo "Gerada credencial: ${key}"
  else
    echo "Mantida credencial existente: ${key}"
  fi
}

for key in \
  MYSQL_ROOT_PASSWORD \
  APP_DB_PASSWORD \
  CMS_DB_PASSWORD \
  PAYMENTS_DB_PASSWORD \
  NOTIFICATIONS_DB_PASSWORD \
  JWT_SECRET \
  AUTH_HASH_SECRET \
  INTEGRATION_SECRET \
  PAYMENTS_INTERNAL_API_KEY \
  NOTIFICATIONS_INTERNAL_API_KEY \
  STRAPI_API_TOKEN_SALT \
  STRAPI_ADMIN_JWT_SECRET \
  STRAPI_TRANSFER_TOKEN_SALT \
  STRAPI_JWT_SECRET \
  STRAPI_ENCRYPTION_KEY
do
  generate_if_missing "$key"
done

app_keys="$(current_value STRAPI_APP_KEYS)"
if needs_value "$app_keys"; then
  app_keys="$(random_base64),$(random_base64),$(random_base64),$(random_base64)"
  set_value STRAPI_APP_KEYS "$app_keys"
  echo "Gerada credencial: STRAPI_APP_KEYS"
else
  echo "Mantida credencial existente: STRAPI_APP_KEYS"
fi

chmod 600 "$env_file"
echo "Credenciais prontas em ${env_file}. O ficheiro nao deve ser enviado ao Git."
