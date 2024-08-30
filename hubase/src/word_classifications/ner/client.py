from dataclasses import dataclass
from logging import Logger

import requests

from exceptions import HuggingFaceException


@dataclass(frozen=True)
class NerResponse:
    entity_group: str
    score: float
    word: str
    start: int
    end: int


class NerClient:
    def __init__(self, url: str, api_key: str, logger: Logger) -> None:
        self.__url = url
        self.__api_key = api_key
        self.__logger = logger

    def safely_call(self, payload: dict) -> list[NerResponse]:
        response = requests.post(
            self.__url,
            headers={"Authorization": f"Bearer {self.__api_key}"},
            json=payload,
        ).json()

        if "error" in response:
            self.__logger.warning(f"HuggingFace error. {response['error']}")
            raise HuggingFaceException(response['error'])

        return list(map(lambda item: NerResponse(
            entity_group=item["entity_group"],
            score=item["score"],
            word=item["word"],
            start=item["start"],
            end=item["end"],
        ), response))
