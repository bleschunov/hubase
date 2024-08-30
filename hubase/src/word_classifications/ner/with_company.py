import typing as t

from word_classifications.ner.iter import People

from llm_qa.abc import LLMClientQA
from model import CSVRow
from prompt.abc_ import Prompt
from word_classifications.abc_ import HubaseIterator


class WithCompany(HubaseIterator):
    def __init__(self, llm_qa: LLMClientQA, prompt: Prompt, people: People, ) -> None:
        self.__llm_qa = llm_qa
        self.__prompt = prompt
        self.__people = people

    def iter(self) -> t.Iterator[CSVRow]:
        for person in self.__people.iter():
            company = self.__llm_qa.ask(self.__prompt.get_and_compile(person=person.name, context=person.source))
            yield CSVRow(
                person=person,
                position="",
                searched_company="",
                inferenced_company=company,
                original_url="",
            )
