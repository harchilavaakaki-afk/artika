"""
Artika Status — запусти перед началом работы с Claude.
Показывает текущее состояние всех проектов и задач.

Использование: python status.py
"""
import httpx
import sys
from datetime import datetime

BASE = "https://artika.onrender.com/api/v1"

STATUS_ICON = {
    "done": "✅",
    "partial": "🔶",
    "not_started": "⬜",
    "bug": "🔴",
    "in_progress": "🔄",
}

def main():
    print(f"\n{'='*60}")
    print(f"  ARTIKA STATUS  —  {datetime.now().strftime('%d.%m.%Y %H:%M')}")
    print(f"{'='*60}\n")

    client = httpx.Client(timeout=30)

    # Auth
    try:
        r = client.post(f"{BASE}/auth/login", json={"email": "admin@artika.ru", "password": "admin123"})
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
    except Exception as e:
        print(f"❌ Бэкенд недоступен: {e}")
        print("   Render спит — подожди 30 сек и попробуй снова\n")
        sys.exit(1)

    # Campaigns summary
    try:
        c = client.get(f"{BASE}/campaigns", params={"per_page": "200"}, headers=headers).json()
        campaigns = c.get("campaigns", [])
        assigned = sum(1 for x in campaigns if x.get("project_id"))
        print(f"📊 КАМПАНИИ: {len(campaigns)} всего, {assigned} назначено, {len(campaigns)-assigned} без проекта\n")
    except Exception:
        print("📊 Кампании: ошибка загрузки\n")
        campaigns = []

    # Sync status
    try:
        s = client.get(f"{BASE}/sync/status", headers=headers).json()
        if s.get("running"):
            print("🔄 SYNC: сейчас выполняется...\n")
        elif s.get("last_result"):
            rpt = s["last_result"].get("report", {})
            print(f"🔄 SYNC: последний — кампаний {rpt.get('campaigns','?')}, групп {rpt.get('ad_groups','?')}\n")
    except Exception:
        pass

    # Projects + tasks
    try:
        projects = client.get(f"{BASE}/projects", headers=headers).json()
        print(f"📁 ПРОЕКТЫ И ЗАДАЧИ ({len(projects)} проектов):\n")

        for p in sorted(projects, key=lambda x: x["id"]):
            camp_count = sum(1 for c in campaigns if c.get("project_id") == p["id"])
            camp_str = f"  [{camp_count} кампаний]" if camp_count else ""

            tasks_r = client.get(f"{BASE}/projects/{p['id']}/tasks", headers=headers)
            tasks = tasks_r.json() if tasks_r.status_code == 200 else []

            done = sum(1 for t in tasks if t.get("status") == "done")
            total = len(tasks)
            progress = f"{done}/{total}" if total else "нет задач"

            print(f"  {p['id']:2d}. {p['name']:<25} {progress}{camp_str}")
            for t in tasks:
                icon = STATUS_ICON.get(t.get("status", ""), "⬜")
                print(f"        {icon} {t['title']}")
            if tasks:
                print()

    except Exception as e:
        print(f"❌ Ошибка загрузки проектов: {e}")

    print(f"\n{'='*60}")
    print("  Скопируй этот вывод и вставь Claude в начале сессии")
    print(f"{'='*60}\n")

    client.close()

if __name__ == "__main__":
    main()
