#!/bin/sh
set -eu

validate_identifier() {
  value="$1"
  label="$2"

  case "$value" in
    ''|*[!A-Za-z0-9_]*)
      echo "Valor invalido para ${label}. Use apenas letras, numeros e underscore." >&2
      exit 1
      ;;
  esac
}

escape_sql_string() {
  printf '%s' "$1" | sed "s/\\\\/\\\\\\\\/g; s/'/''/g"
}

for variable in \
  APP_DB_NAME APP_DB_USER \
  CMS_DB_NAME CMS_DB_USER \
  PAYMENTS_DB_NAME PAYMENTS_DB_USER \
  NOTIFICATIONS_DB_NAME NOTIFICATIONS_DB_USER
do
  eval "value=\${${variable}}"
  validate_identifier "$value" "$variable"
done

app_password="$(escape_sql_string "$APP_DB_PASSWORD")"
cms_password="$(escape_sql_string "$CMS_DB_PASSWORD")"
payments_password="$(escape_sql_string "$PAYMENTS_DB_PASSWORD")"
notifications_password="$(escape_sql_string "$NOTIFICATIONS_DB_PASSWORD")"

MYSQL_PWD="${MYSQL_ROOT_PASSWORD}" mysql --protocol=socket -uroot <<SQL
CREATE DATABASE IF NOT EXISTS \`${APP_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS \`${CMS_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS \`${PAYMENTS_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS \`${NOTIFICATIONS_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS '${APP_DB_USER}'@'%' IDENTIFIED BY '${app_password}';
CREATE USER IF NOT EXISTS '${CMS_DB_USER}'@'%' IDENTIFIED BY '${cms_password}';
CREATE USER IF NOT EXISTS '${PAYMENTS_DB_USER}'@'%' IDENTIFIED BY '${payments_password}';
CREATE USER IF NOT EXISTS '${NOTIFICATIONS_DB_USER}'@'%' IDENTIFIED BY '${notifications_password}';

ALTER USER '${APP_DB_USER}'@'%' IDENTIFIED BY '${app_password}';
ALTER USER '${CMS_DB_USER}'@'%' IDENTIFIED BY '${cms_password}';
ALTER USER '${PAYMENTS_DB_USER}'@'%' IDENTIFIED BY '${payments_password}';
ALTER USER '${NOTIFICATIONS_DB_USER}'@'%' IDENTIFIED BY '${notifications_password}';

GRANT ALL PRIVILEGES ON \`${APP_DB_NAME}\`.* TO '${APP_DB_USER}'@'%';
GRANT ALL PRIVILEGES ON \`${CMS_DB_NAME}\`.* TO '${CMS_DB_USER}'@'%';
GRANT ALL PRIVILEGES ON \`${PAYMENTS_DB_NAME}\`.* TO '${PAYMENTS_DB_USER}'@'%';
GRANT ALL PRIVILEGES ON \`${NOTIFICATIONS_DB_NAME}\`.* TO '${NOTIFICATIONS_DB_USER}'@'%';
FLUSH PRIVILEGES;
SQL

echo "Bases de dados e utilizadores verificados com sucesso."
