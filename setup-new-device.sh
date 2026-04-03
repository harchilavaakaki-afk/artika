#!/bin/bash
# Запусти это один раз на новом устройстве:
# curl -s https://raw.githubusercontent.com/harchilavaakaki-afk/artika/main/setup-new-device.sh | GH_TOKEN=вставь_токен bash

set -e
TOKEN="${GH_TOKEN:?Нужен GH_TOKEN. Запусти: GH_TOKEN=твой_токен bash setup-new-device.sh}"

echo "Настраиваю Artika на этом устройстве..."

# 1. Клонировать репо
git clone "https://${TOKEN}@github.com/harchilavaakaki-afk/artika.git" ~/artika 2>/dev/null || {
  echo "Репо уже есть, обновляю..."
  cd ~/artika && git pull
}
cd ~/artika

# 2. Сохранить токен в git config
git config --global github.token "$TOKEN"

# 3. Настроить хук автосохранения памяти
SETTINGS="$HOME/.claude/settings.json"
mkdir -p "$HOME/.claude"
cat > "$SETTINGS" <<EOF
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash \"$HOME/artika/sync-memory.sh\" push"
          }
        ]
      }
    ]
  }
}
EOF

# 4. Загрузить память из облака
bash sync-memory.sh pull

echo ""
echo "Готово! Открой Claude Code в папке: $HOME/artika"
echo "Всё остальное автоматически."
