import typing as t

from llm_qa.abc import LLMClientQA
from word_classifications.abc_ import IWordClassifications


class WithCompany(IWordClassifications):
    __query = """В какой компании работает {person}? В ответе напиши только название компании. 
Если в тексте нет информации для ответа на вопрос, просто скажи None.

{context}"""

    def __init__(self, llm_qa: LLMClientQA, word_classifications: IWordClassifications) -> None:
        self.__word_classifications = word_classifications
        self.__llm_qa = llm_qa

    def __iter__(self) -> t.Iterator[dict]:
        iter(self.__word_classifications)
        return self

    def __next__(self) -> dict:
        wc = next(self.__word_classifications)
        if wc["entity_group"] != "PER":
            raise RuntimeError("WithCompany decorator works only with entity type = 'PER'")
        wc["inferenced_company"] = self.__llm_qa.ask(self.__query.format(person=wc["word"], context=wc["source"]))
        return wc
