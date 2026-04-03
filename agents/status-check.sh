#!/bin/bash
# Агент: Быстрый статус всех систем Artika
# Используется: bash agents/status-check.sh
# Выводит статус бэкенда, фронтенда, токенов

API_BASE="https://artika.onrender.com"
FRONTEND="https://frontend-rho-five-49.vercel.app"

echo "=== Artika Status Check $(date '+%Y-%m-%d %H:%M') ==="
echo ""

# 1. Backend
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/docs" --max-time 10)
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Backend: онлайн ($API_BASE)"
else
  echo "❌ Backend: недоступен (код: $HTTP_CODE)"
fi

# 2. Frontend
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND" --max-time 10)
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Frontend: онлайн ($FRONTEND)"
else
  echo "❌ Frontend: недоступен (код: $HTTP_CODE)"
fi

# 3. VK Token age
VK_FILE="$HOME/.artika-vk-token-time"
if [ -f "$VK_FILE" ]; then
  TOKEN_TIME=$(cat "$VK_FILE")
  NOW=$(date +%s)
  AGE=$(( (NOW - TOKEN_TIME) / 3600 ))
  REMAINING=$((24 - AGE))
  if [ $AGE -ge 20 ]; then
    echo "⚠️  VK Token: нужно обновить! Возраст: ${AGE}ч, осталось: ~${REMAINING}ч"
  else
    echo "✅ VK Token: свежий (возраст: ${AGE}ч, осталось: ~${REMAINING}ч)"
  fi
else
  echo "⚠️  VK Token: неизвестно (нет файла времени)"
fi

# 4. Login + tasks count
echo ""
echo "--- Задачи ---"
TOKEN=$(curl -s -X POST "$API_BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@artika.ru","password":"admin123"}' \
  --max-time 15 \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token',''))" 2>/dev/null)

if [ -n "$TOKEN" ]; then
  TASKS=$(curl -s "$API_BASE/api/v1/tasks/" -H "Authorization: Bearer $TOKEN" --max-time 15 2>/dev/null)
  echo "$TASKS" | python3 -c "
import sys,json
tasks = json.load(sys.stdin)
by_status = {}
for t in tasks:
    s = t.get('status','?')
    by_status[s] = by_status.get(s,0)+1
print(f'Всего: {len(tasks)}')
for s,c in sorted(by_status.items()):
    icon = {'todo':'📋','in_progress':'🔄','done':'✅'}.get(s,'❓')
    print(f'  {icon} {s}: {c}')
" 2>/dev/null || echo "  Ошибка получения задач"
else
  echo "  Ошибка авторизации"
fi

echo ""
echo "=============================="
