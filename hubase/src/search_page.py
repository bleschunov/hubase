import logging
import typing as t

import googlesearch as google

from search_queries import SearchQueries

logging.basicConfig(level=logging.INFO)


class SearchPage:
    def __init__(self, search_queries: SearchQueries, url_limit: int = 5) -> None:
        self.__search_queries = search_queries
        self.__url_limit = url_limit

    def found(self) -> t.Iterator[tuple[str, dict[str, str]]]:
        for search_query in self.__search_queries.compiled():
            urls = google.search(search_query.query, stop=self.__url_limit)
            for url in urls:
                yield url, search_query.search_params

    # def __iter__(self) -> "SearchPage":
    #     return self
    #
    # def __next__(self) -> [str, dict]:
    #     while len(self.__urls) == 0:
    #         if len(self.__companies) == 0 and self.__current_site_i >= len(self.__sites):
    #             raise StopIteration()
    #
    #         if self.__current_site_i >= len(self.__sites):
    #             self.__current_site_i = 0
    #             self.__current_company = self.__companies.pop(0)
    #             logging.info(f"Поиск для компании: {self.__current_company}")
    #
    #         self.__current_site = self.__sites[self.__current_site_i]
    #         self.__current_site_i += 1
    #
    #         subqueries = [self.company_subquery.format(company=self.__current_company)]
    #
    #         if len(self.__positions) != 0:
    #             positions_ = " OR ".join(f'"{position}"' for position in self.__positions)
    #             subqueries.append(self.positions_subquery.format(positions=positions_))
    #
    #         if len(self.__current_site) != 0:
    #             subqueries.append(self.site_subquery.format(site=self.__current_site))
    #
    #         self.__query = " AND ".join(subqueries)
    #
    #         logging.info(f"Делаем запрос: {self.__query}")
    #         self.__urls.extend(google.search(self.__query, stop=self.__url_limit))
    #
    #     searching_params = {
    #         "site": self.__current_site,
    #         "company": self.__current_company,
    #         "positions": self.__positions
    #     }
    #     return self.__urls.pop(0), searching_params
