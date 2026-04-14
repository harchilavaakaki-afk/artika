#!/usr/bin/env python3
"""Применяет рамки ко ВСЕМ ячейкам на указанной вкладке через raw Sheets API."""
import sys, json, pathlib
import gspread

BASE = pathlib.Path(__file__).parent
CONFIG = json.loads((BASE / "_config.json").read_text("utf-8"))
SHEET_ID = CONFIG["google_sheet"]["spreadsheet_id"]

BORDER = {
    "style": "SOLID",
    "colorStyle": {"rgbColor": {"red": 0.6, "green": 0.6, "blue": 0.6}}
}

def apply_borders(tab_name, col_start=1, col_end=3):
    gc = gspread.service_account(filename=str(BASE / "google_sa.json"))
    sh = gc.open_by_key(SHEET_ID)
    ws = sh.worksheet(tab_name)
    data = ws.get_all_values()
    n_rows = len(data)
    if n_rows == 0:
        print(f"  {tab_name}: пусто"); return

    sheet_id = ws.id
    requests = [{
        "updateBorders": {
            "range": {
                "sheetId": sheet_id,
                "startRowIndex": 0,
                "endRowIndex": n_rows,
                "startColumnIndex": col_start,
                "endColumnIndex": col_end
            },
            "top": BORDER,
            "bottom": BORDER,
            "left": BORDER,
            "right": BORDER,
            "innerHorizontal": BORDER,
            "innerVertical": BORDER
        }
    }]
    sh.batch_update({"requests": requests})
    print(f"  ✓ {tab_name}: рамки на {n_rows} строк (B:C)")

if __name__ == "__main__":
    tabs = sys.argv[1:] if len(sys.argv) > 1 else ["ТЕСТ мероприятия"]
    for tab in tabs:
        apply_borders(tab)
