from scraper import scrape_visible_candidates


if __name__ == "__main__":
    report_path = scrape_visible_candidates()
    print(f"Saved report: {report_path}")
