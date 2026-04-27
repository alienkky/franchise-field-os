from playwright.sync_api import sync_playwright

from config import PROFILE_DIR


def open_persistent_browser(headless: bool = False):
    PROFILE_DIR.mkdir(parents=True, exist_ok=True)
    playwright = sync_playwright().start()
    context = playwright.chromium.launch_persistent_context(
        user_data_dir=str(PROFILE_DIR),
        headless=headless,
        viewport={"width": 1440, "height": 960},
    )
    return playwright, context
