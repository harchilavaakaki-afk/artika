#!/bin/bash
# Агент: Утренний брифинг Artika
# Запускается каждый день в 9:00 МСК через scheduled task
# Собирает: статус API, токены, задачи, деплой

LOG_FILE="$HOME/.claude/projects/C--Users-harch-OneDrive--------------cloude-Artika/memory/morning_briefing.md"
API_BASE="https://artika.onrender.com"
DATE=$(date '+%Y-%m-%d %H:%M')

echo "---" > "$LOG_FILE"
echo "name: Утренний брифинг $DATE" >> "$LOG_FILE"
echo "description: Автоматический статус всех проектов и задач" >> "$LOG_FILE"
echo "type: project" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "# Утренний брифинг — $DATE" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 1. Логин в бэкенд
TOKEN=$(curl -s -X POST "$API_BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@artika.ru","password":"admin123"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token','ERROR'))" 2>/dev/null)

if [ "$TOKEN" = "ERROR" ] || [ -z "$TOKEN" ]; then
  echo "## ❌ Бэкенд недоступен" >> "$LOG_FILE"
  echo "Artika backend не отвечает. Проверь Render.com" >> "$LOG_FILE"
else
  echo "## ✅ Бэкенд онлайн" >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"

  # 2. Задачи
  TASKS=$(curl -s -X GET "$API_BASE/api/v1/tasks/" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)

  TOTAL=$(echo "$TASKS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null || echo "?")
  TODO=$(echo "$TASKS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len([t for t in d if t.get('status')=='todo']))" 2>/dev/null || echo "?")
  IN_PROG=$(echo "$TASKS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len([t for t in d if t.get('status')=='in_progress']))" 2>/dev/null || echo "?")
  DONE=$(echo "$TASKS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len([t for t in d if t.get('status')=='done']))" 2>/dev/null || echo "?")

  echo "## Задачи: $TOTAL всего" >> "$LOG_FILE"
  echo "- todo: $TODO" >> "$LOG_FILE"
  echo "- in_progress: $IN_PROG" >> "$LOG_FILE"
  echo "- done: $DONE" >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"

  # 3. Проекты
  PROJECTS=$(curl -s -X GET "$API_BASE/api/v1/projects/" \
    -H "Authorization: Bearer $TOKEN" 2>/dev/null)
  PROJ_COUNT=$(echo "$PROJECTS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null || echo "?")

  echo "## Проекты: $PROJ_COUNT активных" >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"
fi

# 4. VK токен — проверка возраста
VK_FILE="$HOME/.artika-vk-token-time"
if [ -f "$VK_FILE" ]; then
  TOKEN_TIME=$(cat "$VK_FILE")
  NOW=$(date +%s)
  AGE=$(( (NOW - TOKEN_TIME) / 3600 ))
  if [ $AGE -ge 20 ]; then
    echo "## ⚠️ VK токен нужно обновить!" >> "$LOG_FILE"
    echo "Токену $AGE часов. Осталось ~$((24-AGE))ч." >> "$LOG_FILE"
    echo "Команда: cd Artika && curl -s -X POST \"https://target.my.com/api/v2/oauth2/token.json\" -d \"grant_type=client_credentials&client_id=UJymkmckkxMvK0zs&client_secret=\$(grep VK_ADS_CLIENT_SECRET backend/.env | cut -d= -f2)\"" >> "$LOG_FILE"
  else
    echo "## ✅ VK токен свежий ($AGE ч.)" >> "$LOG_FILE"
  fi
else
  echo "## ⚠️ VK токен: время создания неизвестно, проверь вручную" >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"
echo "Сгенерировано автоматически агентом morning-briefing.sh" >> "$LOG_FILE"

echo "Брифинг готов: $LOG_FILE"
