import typing as t

from llm_qa.abc import LLMClientQA
from model import CSVRow
from prompt.abc_ import Prompt
from word_classifications.abc_ import HubaseIterator
from word_classifications.ner.people import People


class NerCSVRows(HubaseIterator):
    def __init__(
        self,
        people: People,
        llm_qa: LLMClientQA,
        company_prompt: Prompt,
        position_prompt: Prompt,
        url: str,
        searching_params: dict[str, str]
    ) -> None:
        self.__people = people
        self.__llm_qa = llm_qa
        self.__company_prompt = company_prompt
        self.__position_prompt = position_prompt
        self.__url = url
        self.__searching_params = searching_params

    def iter(self) -> t.Iterator[CSVRow]:
        for person in self.__people.iter():
            inferenced_company = self.__llm_qa.ask(self.__company_prompt.get_and_compile(person=person.name, context=person.source))
            inferenced_position = self.__llm_qa.ask(self.__position_prompt.get_and_compile(person=person.name, context=person.source))
            yield CSVRow(
                person=person,
                position=inferenced_position,
                searched_company=self.__searching_params["company"],
                inferenced_company=inferenced_company,
                original_url=self.__url,
            )
