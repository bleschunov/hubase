import logging
import googlesearch as google

logging.basicConfig(level=logging.INFO)


class GoogleClient:
    company_name = '"{company}"'
    site = 'site:{site}'
    # positions = '("директор" OR "директор ГК ССК" OR "руководитель" OR "начальник" OR "глава")'
    positions = '({positions})'
    google_query_with_site = " AND ".join([company_name, site, positions])
    google_query = " AND ".join([company_name, positions])

    def search(self, company: str, site: str, positions: list[str]) -> list[str]:
        logging.info(f"Поиск для компании: {company}")
        positions = " OR ".join(f'"{position}"' for position in positions)
        if site != "":
            query = self.google_query_with_site.format(company=company, site=site, positions=positions)
        else:
            query = self.google_query.format(company=company, positions=positions)
        logging.info(f"Делаем запрос: {query}")
        return next(google.search(query, stop=1))
