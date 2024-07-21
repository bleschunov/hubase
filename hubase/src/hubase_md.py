import json
import logging

import requests

logging.basicConfig(level=logging.INFO)


class JinaException(Exception):
    pass


class HubaseMd:
    __jina_query = "https://r.jina.ai/{url}"

    def __init__(self, url: str) -> None:
        self.__url = url

    @property
    def md(self) -> str:
        logging.info(f"Строим Markdown для сайта: {self.__url}")
        query = self.__jina_query.format(url=self.__url)
        logging.info(f"Делаем запрос: {query}")
        response = requests.get(url=query, headers={
            "X-Return-Format": "text"
        })
        response = response.text
        self.__raise_exception_on_jina_error(response)
        return response

    @property
    def url(self) -> str:
        return self.__url

    def __raise_exception_on_jina_error(self, jina_response: str) -> None:
        try:
            error = json.loads(jina_response)
        except ValueError:
            pass
        else:
            raise JinaException(error["cause"]["name"])
