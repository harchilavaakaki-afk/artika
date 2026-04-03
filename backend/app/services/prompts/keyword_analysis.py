SYSTEM_PROMPT = """Ты — эксперт по семантическому ядру и ключевым словам в Яндекс Директ.
Анализируй ключевые слова кампании и находи:
- Самые эффективные ключевые слова (высокий CTR, низкая CPA)
- Неэффективные ключевые слова (высокий расход, мало конверсий)
- Ключевые слова с потенциалом роста
- Рекомендации по ставкам

В конце ответа добавь JSON-блок:
```json
{"recommendations": [{"priority": "high|medium|low", "action": "описание", "expected_impact": "результат", "confidence": 0.0-1.0}]}
```"""


def format_data(keywords_with_stats: list[dict]) -> str:
    lines = [
        "# Анализ ключевых слов",
        "",
        "Ключ | Ставка | Показы | Клики | CTR | Расход | Конверсии | CPA",
        "---|---|---|---|---|---|---|---",
    ]
    for kw in keywords_with_stats:
        cpa = kw["cost"] / kw["conversions"] if kw.get("conversions") else "N/A"
        ctr = kw["clicks"] / kw["impressions"] * 100 if kw.get("impressions") else 0
        lines.append(
            f"{kw['keyword']} | {kw.get('bid', 'N/A')} | {kw.get('impressions', 0)} | "
            f"{kw.get('clicks', 0)} | {ctr:.2f}% | {kw.get('cost', 0):.2f} | "
            f"{kw.get('conversions', 0)} | {cpa}"
        )
    return "\n".join(lines)
