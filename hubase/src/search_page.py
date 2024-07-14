import logging

import googlesearch as google

logging.basicConfig(level=logging.INFO)


class SearchPage:
    company_subquery = '"{company}"'
    site_subquery = 'site:{site}'
    positions_subquery = '({positions})'

    def __init__(self, companies: list[str], positions: list[str], sites: list[str], url_limit: int = 5) -> None:
        self.__companies = companies[1:]
        self.__current_company = companies[0]
        self.__positions = positions
        self.__sites = sites
        self.__current_site = sites[0]
        self.__current_site_i = 0
        self.__urls = []
        self.__url_limit = url_limit

    def __iter__(self) -> "SearchPage":
        return self

    def __next__(self) -> [str, dict]:
        while len(self.__urls) == 0:
            if len(self.__companies) == 0 and self.__current_site_i >= len(self.__sites):
                raise StopIteration()

            if self.__current_site_i >= len(self.__sites):
                self.__current_site_i = 0
                self.__current_company = self.__companies.pop(0)
                logging.info(f"Поиск для компании: {self.__current_company}")

            self.__current_site = self.__sites[self.__current_site_i]
            self.__current_site_i += 1

            subqueries = [self.company_subquery.format(company=self.__current_company)]

            if len(self.__positions) != 0:
                positions_ = " OR ".join(f'"{position}"' for position in self.__positions)
                subqueries.append(self.positions_subquery.format(positions=positions_))

            if len(self.__current_site) != 0:
                subqueries.append(self.site_subquery.format(site=self.__current_site))

            self.__query = " AND ".join(subqueries)

            logging.info(f"Делаем запрос: {self.__query}")
            self.__urls.extend(google.search(self.__query, stop=self.__url_limit))

        searching_params = {
            "site": self.__current_site,
            "company": self.__current_company,
            "positions": self.__positions
        }
        return self.__urls.pop(0), searching_params
