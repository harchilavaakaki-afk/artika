#!/usr/bin/env python3
"""
Получение Yandex OAuth токена и сохранение в _config.json.
Запусти: python get_token.py
"""
import json, pathlib, webbrowser, urllib.request, sys

BASE = pathlib.Path(__file__).parent
CONFIG_PATH = BASE / "_config.json"

# Приложение artikavidnoe в Яндекс.Директ
CLIENT_ID = "6403e4add4594584a94030e97f06848a"

# URL для получения токена (implicit flow — токен сразу в URL)
AUTH_URL = f"https://oauth.yandex.ru/authorize?response_type=token&client_id={CLIENT_ID}"

def test_metrika(token, counter_id=104590290):
    try:
        req = urllib.request.Request(
            f"https://api-metrika.yandex.net/management/v1/counter/{counter_id}",
            headers={"Authorization": f"OAuth {token}"}
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status == 200
    except Exception as e:
        return False

def test_direct(token, client_login="sportvsegda-direct"):
    try:
        import urllib.parse
        body = json.dumps({"method": "ping"}).encode()
        req = urllib.request.Request(
            "https://api.direct.yandex.com/json/v5/campaigns",
            data=json.dumps({"method":"get","params":{"SelectionCriteria":{},"FieldNames":["Id"],"Page":{"Limit":1}}}).encode(),
            headers={
                "Authorization": f"Bearer {token}",
                "Client-Login": client_login,
                "Content-Type": "application/json; charset=utf-8",
            }
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status == 200
    except Exception as e:
        return False

def save_token(key, token):
    cfg = json.loads(CONFIG_PATH.read_text("utf-8"))
    cfg[key]["oauth_token"] = token
    CONFIG_PATH.write_text(json.dumps(cfg, ensure_ascii=False, indent=2), "utf-8")
    print(f"  ✓ Токен сохранён в _config.json [{key}]")

def main():
    print("=" * 55)
    print(" Получение Yandex OAuth токена для отчётов Артика")
    print("=" * 55)
    print()
    print("Нужны ДВА токена:")
    print("  1. Метрика — от аккаунта с доступом к счётчику 104590290")
    print("  2. Директ  — от агентского аккаунта artikavidnoe")
    print()

    # ── Токен 1: Метрика ──────────────────────────────────────
    print("─" * 55)
    print("ШАГ 1: Токен для Яндекс.Метрики")
    print()
    print("  Войди в аккаунт h.akaky (или тот, у кого есть")
    print("  доступ к счётчику padelvidnoe.ru) и перейди по ссылке:")
    print()
    print(f"  {AUTH_URL}")
    print()
    print("  После авторизации URL будет вида:")
    print("  https://oauth.yandex.ru/...#access_token=XXXXX&...")
    print("  Скопируй значение после 'access_token='")
    print()
    input("  Нажми Enter, когда будешь готов открыть браузер... ")
    webbrowser.open(AUTH_URL)
    print()
    metrika_token = input("  Вставь токен Метрики: ").strip()
    if metrika_token:
        ok = test_metrika(metrika_token)
        if ok:
            print("  ✓ Токен работает для Метрики!")
            save_token("metrika", metrika_token)
        else:
            print("  ⚠ Токен не прошёл проверку Метрики.")
            print("    Возможно, приложение не имеет Метрика-скоупа.")
            print("    Создай новое приложение на oauth.yandex.ru с галочкой")
            print("    'Яндекс.Метрика' и повтори.")
            # Сохраняем всё равно — пусть пользователь проверит вручную
            save_token("metrika", metrika_token)
    else:
        print("  Пропускаем Метрику.")

    print()

    # ── Токен 2: Директ ───────────────────────────────────────
    print("─" * 55)
    print("ШАГ 2: Токен для Яндекс.Директ (агентский аккаунт artikavidnoe)")
    print()
    print("  ВАЖНО: войди в аккаунт artikavidnoe перед переходом по ссылке!")
    print(f"  {AUTH_URL}")
    print()
    input("  Нажми Enter, чтобы открыть браузер (войди как artikavidnoe)... ")
    webbrowser.open(AUTH_URL)
    print()
    direct_token = input("  Вставь токен Директа: ").strip()
    if direct_token:
        ok = test_direct(direct_token)
        if ok:
            print("  ✓ Токен работает для Директа!")
        else:
            print("  ⚠ Токен не прошёл проверку Директа (возможно, нет прав или waiting list).")
        save_token("direct", direct_token)
    else:
        print("  Пропускаем Директ.")

    print()
    print("=" * 55)
    print(" Готово! Теперь запусти:")
    print(" bash build_week.sh 2026-04-10 2026-04-16")
    print("=" * 55)

if __name__ == "__main__":
    main()
