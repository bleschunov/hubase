import logging

import requests

logging.basicConfig(level=logging.INFO)


class HubaseMd:
    __jina_query = "https://r.jina.ai/{url}"

    def __init__(self, url: str) -> None:
        self.__url = url

    @property
    def md(self) -> str:
        logging.info(f"Строим Markdown для сайта: {self.__url}")
        query = self.__jina_query.format(url=self.__url)
        logging.info(f"Делаем запрос: {query}")
        return requests.get(url=query, headers={
            "X-Return-Format": "text"
        }).text

    @property
    def url(self) -> str:
        return self.__url
