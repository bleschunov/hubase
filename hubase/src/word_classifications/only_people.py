import logging
import typing as t

from word_classifications.abc_ import IWordClassifications

logging.basicConfig(level=logging.INFO)


# TODO: move to decorators folder
class OnlyPeople(IWordClassifications):
    def __init__(self, word_classifications: IWordClassifications) -> None:
        self.__word_classifications = word_classifications

    def __iter__(self) -> t.Iterator[dict]:
        iter(self.__word_classifications)
        return self

    def __next__(self) -> dict:
        while True:
            wc = next(self.__word_classifications)
            if wc["entity_group"] == "PER":
                logging.info(f"Найден человек: {wc['word']}")
                wc["name"] = wc["word"]
                return wc
