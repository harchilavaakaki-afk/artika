#!/usr/bin/env bash
# deploy.sh — Vercel-операции для arcfit.ru (macOS/Linux/WSL/git-bash)
#
# Использование:
#   ./deploy.sh status         # домены, env, последний деплой
#   ./deploy.sh set-env        # залить .env.production.example → Vercel
#   ./deploy.sh add-domain     # добавить arcfit.ru в Vercel (даёт DNS-инструкции)
#   ./deploy.sh verify-domain  # проверить TXT-верификацию
#   ./deploy.sh redeploy       # пустой commit + push (триггер rebuild)
#   ./deploy.sh prod-check     # curl-проверка titles, метрики, лид-формы
#
# Зависимости: bash, curl, python3, git
# Credentials: ~/.claude/secrets/vercel.env (VERCEL_TOKEN, VERCEL_TEAM_ID, VERCEL_PROJECT_ID_ARCFIT_NEXT)

set -euo pipefail

SECRETS="${HOME}/.claude/secrets/vercel.env"
[ -f "$SECRETS" ] || { echo "ERROR: $SECRETS отсутствует. Создать токен: https://vercel.com/account/tokens" >&2; exit 1; }

# shellcheck disable=SC1090
source "$SECRETS"

: "${VERCEL_TOKEN:?VERCEL_TOKEN не задан в $SECRETS}"
: "${VERCEL_TEAM_ID:?VERCEL_TEAM_ID не задан}"
: "${VERCEL_PROJECT_ID_ARCFIT_NEXT:?VERCEL_PROJECT_ID_ARCFIT_NEXT не задан}"

BASE="https://api.vercel.com"
TEAM="$VERCEL_TEAM_ID"
PRJ="$VERCEL_PROJECT_ID_ARCFIT_NEXT"

api() {
    local method="$1" path="$2" body="${3:-}"
    local url="$BASE$path"
    [[ "$url" == *"teamId="* ]] || { [[ "$url" == *"?"* ]] && url="$url&teamId=$TEAM" || url="$url?teamId=$TEAM"; }
    if [ -n "$body" ]; then
        curl -sS -X "$method" -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" -d "$body" "$url"
    else
        curl -sS -X "$method" -H "Authorization: Bearer $VERCEL_TOKEN" "$url"
    fi
}

cmd_status() {
    echo "=== arcfit-next status ==="
    api GET "/v9/projects/$PRJ" | python3 -c "import sys,json; d=json.load(sys.stdin); print('rootDirectory:',d.get('rootDirectory'),'\\nframework:',d.get('framework'),'\\nlive:',d.get('live'))"
    echo
    echo "=== Domains ==="
    api GET "/v9/projects/$PRJ/domains" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(' ',x['name'],'verified='+str(x.get('verified'))) for x in d.get('domains',[])]"
    echo
    echo "=== Latest deployments ==="
    api GET "/v6/deployments?projectId=$PRJ&limit=5" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(' ',x['uid'][:14], x['state'], x['meta'].get('githubCommitSha','?')[:7]) for x in d.get('deployments',[])]"
    echo
    echo "=== Env vars ==="
    api GET "/v10/projects/$PRJ/env" | python3 -c "import sys,json; d=json.load(sys.stdin); [print(' ',e['key'], e.get('target'), e.get('type')) for e in d.get('envs',[])]"
}

cmd_set_env() {
    local envfile
    envfile="$(dirname "$0")/.env.production.example"
    [ -f "$envfile" ] || { echo "Нет $envfile" >&2; exit 1; }
    echo "Заливаю env из $envfile..."
    while IFS= read -r line; do
        line="${line%%#*}"
        line="${line## }"; line="${line%% }"
        [ -z "$line" ] && continue
        [[ "$line" == *=* ]] || continue
        local key="${line%%=*}"
        local val="${line#*=}"
        case "$key" in VERCEL_TOKEN|VERCEL_TEAM_ID|VERCEL_PROJECT_ID_ARCFIT_NEXT) echo "  skip $key"; continue;; esac
        local type="encrypted"
        [[ "$key" == NEXT_PUBLIC_* ]] && type="plain"
        local body
        body=$(printf '{"key":"%s","value":"%s","type":"%s","target":["production"]}' "$key" "$val" "$type")
        local resp
        resp=$(api POST "/v10/projects/$PRJ/env" "$body" || true)
        if echo "$resp" | grep -q '"created"\|"id"'; then
            echo "  ✓ $key"
        else
            echo "  ! $key (возможно уже есть)"
        fi
    done < "$envfile"
}

cmd_add_domain() {
    echo "Добавляю arcfit.ru..."
    api POST "/v10/projects/$PRJ/domains" '{"name":"arcfit.ru"}' | python3 -c "
import sys, json
d = json.load(sys.stdin)
if d.get('error'):
    print('  !', d['error'].get('message','?'))
else:
    print('  ✓ arcfit.ru добавлен')
    if d.get('verification'):
        print('\\n  Прописать в nic.ru DNS:')
        for v in d['verification']:
            print(f\"    Тип:   {v.get('type')}\")
            print(f\"    Имя:   {v.get('domain')}\")
            print(f\"    Знач.: {v.get('value')}\")
            print()
"
    echo
    echo "Добавляю www.arcfit.ru с редиректом..."
    api POST "/v10/projects/$PRJ/domains" '{"name":"www.arcfit.ru","redirect":"arcfit.ru"}' >/dev/null 2>&1 && echo "  ✓ www→apex" || echo "  ! возможно уже есть"
}

cmd_verify_domain() {
    api GET "/v9/projects/$PRJ/domains/arcfit.ru" | python3 -c "import sys,json; d=json.load(sys.stdin); print('verified:', d.get('verified'))"
}

cmd_redeploy() {
    git commit --allow-empty -m "trigger: arcfit-next rebuild"
    git push origin "HEAD:main"
}

cmd_prod_check() {
    local url="https://arcfit-next.vercel.app"
    echo "=== Проверка $url ==="
    for p in / /schedule /pricing /programs /facilities /trainers /contacts; do
        local title
        title=$(curl -s "$url$p?v=$(date +%s)" | grep -oE '<title>[^<]+</title>' | head -1 || true)
        printf '  %-12s %s\n' "$p" "$title"
    done
    echo
    echo -n "Метрика 95693874 в HTML: "
    curl -s "$url/" | grep -q 'ym(95693874' && echo "✓" || echo "✗"
    echo -n "Лид-форма (/api/lead):    "
    local r
    r=$(curl -s -X POST -H "Content-Type: application/json" -d '{"name":"_CHECK_","phone":"+79000000000"}' "$url/api/lead")
    echo "$r" | grep -q '"success":true' && echo "✓ ($r)" || echo "✗ ($r)"
}

case "${1:-status}" in
    status)        cmd_status ;;
    set-env)       cmd_set_env ;;
    add-domain)    cmd_add_domain ;;
    verify-domain) cmd_verify_domain ;;
    redeploy)      cmd_redeploy ;;
    prod-check)    cmd_prod_check ;;
    *)             echo "Usage: $0 {status|set-env|add-domain|verify-domain|redeploy|prod-check}"; exit 1 ;;
esac
