#!/bin/bash
# Синхронизация памяти Claude с GitHub
# Использование:
#   ./sync-memory.sh pull   — загрузить память из облака (на новом устройстве)
#   ./sync-memory.sh push   — сохранить память в облако (после сессии)

MEMORY_DIR="$HOME/.claude/projects/C--Users-harch-OneDrive--------------cloude-Artika/memory"
# Токен берётся из git credential или переменной окружения GH_TOKEN
GH_TOKEN="${GH_TOKEN:-$(git config --global github.token 2>/dev/null)}"
REPO_URL="https://${GH_TOKEN}@github.com/harchilavaakaki-afk/artika-memory.git"
TEMP_DIR="$HOME/.artika-memory-sync"

if [ "$1" = "pull" ]; then
    echo "Загружаю память из облака..."
    mkdir -p "$MEMORY_DIR"
    rm -rf "$TEMP_DIR"
    git clone "$REPO_URL" "$TEMP_DIR" --quiet
    cp "$TEMP_DIR"/*.md "$MEMORY_DIR/"
    rm -rf "$TEMP_DIR"
    echo "Готово! Файлов: $(ls $MEMORY_DIR/*.md | wc -l)"

elif [ "$1" = "push" ]; then
    echo "Сохраняю память в облако..."
    rm -rf "$TEMP_DIR"
    git clone "$REPO_URL" "$TEMP_DIR" --quiet
    cp "$MEMORY_DIR"/*.md "$TEMP_DIR/"
    cd "$TEMP_DIR"
    git config user.email "harchilavaakaki@gmail.com"
    git config user.name "Akaki Harchilava"
    git add -A
    git diff --cached --quiet && echo "Изменений нет." && exit 0
    git commit -m "Memory sync $(date '+%Y-%m-%d %H:%M')" --quiet
    git push origin main --quiet
    rm -rf "$TEMP_DIR"
    echo "Готово! Память сохранена в GitHub."

else
    echo "Использование: ./sync-memory.sh pull|push"
fi
