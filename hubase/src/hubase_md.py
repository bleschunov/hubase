import json
import logging
import requests

class JinaException(Exception):
    pass

class HubaseMd:
    __jina_query = "https://r.jina.ai/{url}"

    def __init__(self, url: str) -> None:
        self.__url = url

    @property
    def md(self) -> str:
        log_message = f"Строим Markdown для сайта: {self.__url}"
        logging.info(log_message)

        query = self.__jina_query.format(url=self.__url)
        log_message = f"Делаем запрос: {query}"
        logging.info(log_message)

        response = requests.get(url=query, headers={"X-Return-Format": "text"})
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
            log_message = "Jina ответила без ошибок."
            logging.info(log_message)
            return
        else:
            log_message = "Ошибка Jina."
            logging.info(log_message)
            raise JinaException(error)


