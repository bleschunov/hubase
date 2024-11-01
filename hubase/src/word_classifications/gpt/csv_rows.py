import typing as t

from model import CSVRow
from word_classifications.abc_ import HubaseIterator
from word_classifications.gpt.people import GPTPeople


class GPTCSVRows(HubaseIterator):
    def __init__(
        self, people: GPTPeople, url: str, searching_params: dict[str, str]
    ) -> None:
        self.__people = people
        self.__url = url
        self.__searching_params = searching_params

    def iter(self) -> t.Iterator[CSVRow]:
        for response in self.__people.iter():
            yield CSVRow(
                name=response.person.name,
                source=response.source.replace("\n", " ")
                .replace("\r", " ")
                .replace("\t", " "),
                position=response.person.position,
                searched_company=self.__searching_params["company"],
                inferenced_company=response.person.company,
                original_url=self.__url,
            )
