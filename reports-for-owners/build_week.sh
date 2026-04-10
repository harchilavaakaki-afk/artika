#!/usr/bin/env bash
# Пятничный запуск: сбор данных + генерация отчёта
# Использование: bash build_week.sh 2026-04-10 2026-04-16
# После завершения — заполни _manual_input.json и перезапусти generate_report.py

set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

DATE1="${1:-}" DATE2="${2:-}"
if [[ -z "$DATE1" || -z "$DATE2" ]]; then
    echo "Укажи даты: bash build_week.sh 2026-04-10 2026-04-16"
    exit 1
fi

echo "========================================"
echo " Артика — недельный отчёт $DATE1 → $DATE2"
echo "========================================"

echo ""
echo "[1/3] Яндекс Метрика..."
python connector_metrika.py "$DATE1" "$DATE2" || echo "  ⚠ Метрика: проверь токен в _config.json"

echo ""
echo "[2/3] Яндекс Директ..."
python connector_direct.py "$DATE1" "$DATE2" || echo "  ⚠ Директ: проверь токен в _config.json"

echo ""
echo "[3/3] Телеграм подписчики..."
python connector_tg.py || echo "  ⚠ ТГ: ошибка парсинга, заполни вручную"

echo ""
echo "========================================"
echo " Данные сохранены в _live_data.json"
echo ""
echo " Следующий шаг:"
echo " 1. Заполни _manual_input.json:"
echo "    - period_label (напр. 10-16.04.26)"
echo "    - tab1_what_we_did"
echo "    - tab2_what_we_did"
echo "    - tab3_promo"
echo "    - tab4_events (данные от @olesia_1908)"
echo ""
echo " 2. Запусти генератор:"
echo "    python generate_report.py $DATE1 $DATE2"
echo "========================================"
