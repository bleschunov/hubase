import typing as t
from logging import Logger

from word_classifications.abc_ import HubaseIterator
from word_classifications.model import Person
from word_classifications.ner.client import NerClient, NerResponse


class NerPeople(HubaseIterator):
    def __init__(
        self,
        text: str,
        client: NerClient,
        logger: Logger,
        *,
        batch_size: int = 512,
    ) -> None:
        self.__text = text
        self.__client = client
        self.__batch_size = batch_size
        self.__logger = logger

    def iter(self) -> t.Iterator[Person]:
        for batch in self.__text_batches():
            self.__logger.info("Делаем запрос в NER")
            raw_word_classification = self.__client.safely_call(
                payload={
                    "inputs": batch,
                    "options": {"wait_for_model": True},
                    "parameters": {"aggregation_strategy": "simple"},
                }
            )
            for wc in filter(self.__only_people, raw_word_classification):
                yield Person(
                    name=wc.word,
                    source=batch,
                )

    def __text_batches(self) -> list[str]:
        for i in range(0, len(self.__text), self.__batch_size):
            yield self.__text[i : i + self.__batch_size]

    def __only_people(self, ner_response: NerResponse) -> bool:
        return ner_response.entity_group == "PER"
