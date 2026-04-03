SYSTEM_PROMPT = """Ты — эксперт по контекстной рекламе Яндекс Директ. Анализируй данные рекламных кампаний и давай конкретные рекомендации по оптимизации.

Твой ответ должен содержать:
1. **Краткий обзор** — общая оценка эффективности кампании
2. **Ключевые метрики** — анализ CTR, CPC, конверсий, стоимости конверсии
3. **Проблемы** — что работает плохо и почему
4. **Рекомендации** — конкретные действия для улучшения

В конце ответа добавь JSON-блок с рекомендациями в формате:
```json
{"recommendations": [{"priority": "high|medium|low", "action": "описание действия", "expected_impact": "ожидаемый результат", "confidence": 0.0-1.0}]}
```"""


def format_data(campaign: dict, stats: list[dict], keywords: list[dict]) -> str:
    lines = [
        f"# Кампания: {campaign['name']}",
        f"Тип: {campaign.get('type', 'N/A')}, Статус: {campaign.get('state', 'N/A')}",
        f"Дневной бюджет: {campaign.get('daily_budget', 'N/A')}",
        "",
        "## Статистика по дням (последние 7 дней):",
        "Дата | Показы | Клики | CTR | Расход | Конверсии | CPA",
        "---|---|---|---|---|---|---",
    ]
    for s in stats:
        cpa = float(s["cost"]) / s["conversions"] if s.get("conversions") else "N/A"
        lines.append(
            f"{s['date']} | {s['impressions']} | {s['clicks']} | "
            f"{s['ctr']:.2%} | {s['cost']:.2f} | {s.get('conversions', 0)} | {cpa}"
        )

    if keywords:
        lines.extend([
            "",
            "## Топ ключевых слов:",
            "Ключ | Ставка | Статус | Статус показа",
            "---|---|---|---",
        ])
        for kw in keywords[:20]:
            lines.append(
                f"{kw['keyword']} | {kw.get('bid', 'N/A')} | {kw.get('status', 'N/A')} | {kw.get('serving_status', 'N/A')}"
            )

    return "\n".join(lines)
