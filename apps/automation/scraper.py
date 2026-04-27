from datetime import datetime

import pandas as pd

from browser import open_persistent_browser
from config import MYFRANCHISE_B2B_URL, REPORT_DIR, SCREENSHOT_DIR
from selectors import SELECTORS


def scrape_visible_candidates() -> str:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

    playwright, context = open_persistent_browser(headless=False)
    page = context.pages[0] if context.pages else context.new_page()

    try:
        page.goto(MYFRANCHISE_B2B_URL, wait_until="domcontentloaded")
        page.wait_for_timeout(1500)

        rows = []
        for row in page.locator(SELECTORS["candidate_rows"]).all():
            rows.append(
                {
                    "title": row.locator(SELECTORS["candidate_title"]).inner_text(timeout=1000),
                    "region": row.locator(SELECTORS["candidate_region"]).inner_text(timeout=1000),
                    "cost": row.locator(SELECTORS["candidate_cost"]).inner_text(timeout=1000),
                }
            )

        output_path = REPORT_DIR / f"myfranchise-candidates-{datetime.now():%Y%m%d-%H%M}.xlsx"
        pd.DataFrame(rows).to_excel(output_path, index=False)
        return str(output_path)
    except Exception:
        page.screenshot(path=str(SCREENSHOT_DIR / f"error-{datetime.now():%Y%m%d-%H%M%S}.png"), full_page=True)
        raise
    finally:
        context.close()
        playwright.stop()
