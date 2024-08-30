import typing as t
from logging import Logger

from word_classifications.abc_ import IPeople


# TODO: move to decorators folder
class OnlyPeople(IPeople):
    def __init__(self, logger: Logger, word_classifications: IPeople) -> None:
        self.__word_classifications = word_classifications
        self.__logger = logger

    def __iter__(self) -> t.Iterator[dict]:
        iter(self.__word_classifications)
        return self

    def __next__(self) -> dict:
        while True:
            wc = next(self.__word_classifications)
            if wc["entity_group"] == "PER":
                self.__logger.info(f"Найден человек: {wc['word']}")
                wc["name"] = wc["word"]
                return wc
