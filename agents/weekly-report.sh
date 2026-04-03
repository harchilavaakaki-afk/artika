#!/bin/bash
# Агент: Еженедельный отчёт (запускается по пятницам)
# Собирает метрики за неделю, задачи, кампании → сохраняет в memory

API_BASE="https://artika.onrender.com"
WEEK=$(date '+%Y-W%V')
REPORT_FILE="$HOME/.claude/projects/C--Users-harch-OneDrive--------------cloude-Artika/memory/weekly_report_$WEEK.md"

# Авторизация
TOKEN=$(curl -s -X POST "$API_BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@artika.ru","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)

cat > "$REPORT_FILE" << HEADER
---
name: Отчёт $WEEK
description: Еженедельный отчёт по всем проектам Artika
type: project
---

# Еженедельный отчёт — $WEEK
Дата генерации: $(date '+%Y-%m-%d %H:%M')

HEADER

if [ -z "$TOKEN" ]; then
  echo "❌ Ошибка: не удалось авторизоваться в бэкенде" >> "$REPORT_FILE"
  exit 1
fi

# Проекты
echo "## Проекты" >> "$REPORT_FILE"
curl -s "$API_BASE/api/v1/projects/" -H "Authorization: Bearer $TOKEN" | \
  python3 -c "
import sys,json
projects = json.load(sys.stdin)
for p in projects:
    print(f'- **{p.get(\"name\",\"?\")}** ({p.get(\"domain\",\"?\")})')
" 2>/dev/null >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"
echo "## Задачи" >> "$REPORT_FILE"
curl -s "$API_BASE/api/v1/tasks/" -H "Authorization: Bearer $TOKEN" | \
  python3 -c "
import sys,json
tasks = json.load(sys.stdin)
by_status = {}
for t in tasks:
    s = t.get('status','?')
    by_status[s] = by_status.get(s,[])
    by_status[s].append(t.get('title','?'))
for s in ['in_progress','todo','done']:
    items = by_status.get(s,[])
    if items:
        icon = {'todo':'📋','in_progress':'🔄','done':'✅'}.get(s,'❓')
        print(f'### {icon} {s.upper()} ({len(items)})')
        for i in items[:10]:
            print(f'- {i}')
        if len(items) > 10:
            print(f'- ... и ещё {len(items)-10}')
        print()
" 2>/dev/null >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"
echo "## Кампании" >> "$REPORT_FILE"
curl -s "$API_BASE/api/v1/campaigns/" -H "Authorization: Bearer $TOKEN" | \
  python3 -c "
import sys,json
camps = json.load(sys.stdin)
active = [c for c in camps if c.get('status') == 'active']
print(f'Всего: {len(camps)}, активных: {len(active)}')
for c in active[:15]:
    print(f'- {c.get(\"name\",\"?\")} [{c.get(\"platform\",\"?\")}]')
" 2>/dev/null >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "*Отчёт сгенерирован автоматически агентом weekly-report.sh*" >> "$REPORT_FILE"

echo "Еженедельный отчёт сохранён: $REPORT_FILE"
