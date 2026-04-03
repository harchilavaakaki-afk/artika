#!/bin/bash
# Агент: Автообновление VK токена
# Запускается каждые 23 часа через cron/scheduled task
# Обновляет VK_ADS_ACCESS_TOKEN в backend/.env

ENV_FILE="$(dirname "$0")/../backend/.env"
LOG_PREFIX="[VK Token Refresh $(date '+%Y-%m-%d %H:%M')]"

if [ ! -f "$ENV_FILE" ]; then
  echo "$LOG_PREFIX ERROR: .env not found at $ENV_FILE"
  exit 1
fi

CLIENT_ID="UJymkmckkxMvK0zs"
CLIENT_SECRET=$(grep "^VK_ADS_CLIENT_SECRET=" "$ENV_FILE" | cut -d= -f2)

if [ -z "$CLIENT_SECRET" ]; then
  echo "$LOG_PREFIX ERROR: VK_ADS_CLIENT_SECRET not found in .env"
  exit 1
fi

# Запрос нового токена
RESPONSE=$(curl -s -X POST "https://target.my.com/api/v2/oauth2/token.json" \
  -d "grant_type=client_credentials&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET")

NEW_TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null)

if [ -z "$NEW_TOKEN" ]; then
  echo "$LOG_PREFIX ERROR: Failed to get new token. Response: $RESPONSE"
  exit 1
fi

# Обновить .env
if grep -q "^VK_ADS_ACCESS_TOKEN=" "$ENV_FILE"; then
  # Заменить существующий
  sed -i "s/^VK_ADS_ACCESS_TOKEN=.*/VK_ADS_ACCESS_TOKEN=$NEW_TOKEN/" "$ENV_FILE"
else
  # Добавить новый
  echo "VK_ADS_ACCESS_TOKEN=$NEW_TOKEN" >> "$ENV_FILE"
fi

# Сохранить время создания токена
echo "$(date +%s)" > "$HOME/.artika-vk-token-time"

echo "$LOG_PREFIX SUCCESS: Token updated (first 20 chars: ${NEW_TOKEN:0:20}...)"
