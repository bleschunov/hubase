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
            logging.info(f"Делаем запрос: {search_query.query}")
            urls = google.search(search_query.query, stop=self.__url_limit)
            for url in urls:
                yield url, search_query.search_params
