import typing as t
from logging import Logger

import googlesearch as google

from search_queries import SearchQueries


class SearchPage:
    def __init__(self, search_queries: SearchQueries, logger: Logger, url_limit: int = 5) -> None:
        self.__search_queries = search_queries
        self.__url_limit = url_limit
        self.__logger = logger

    def found(self) -> t.Iterator[tuple[str, dict[str, str]]]:
        for search_query in self.__search_queries.compiled():
            self.__logger.info(f"Делаем запрос: {search_query.query}")
            urls = google.search(search_query.query)
            for url in urls:
                yield url, search_query.search_params
