from llm_qa.abc import LLMClientQA
from word_classifications.abc import IWordClassifications


class WithPosition(IWordClassifications):
    __query = """Какую должность занимает {person}? В ответе напиши только название должности. 
Если в тексте нет информации для ответа на вопрос, просто скажи None.

{context}"""

    def __init__(self, llm_qa: LLMClientQA, word_classifications: IWordClassifications) -> None:
        self.__word_classifications = word_classifications
        self.__llm_qa = llm_qa

    def __iter__(self) -> "IWordClassifications":
        return self

    def __next__(self) -> dict:
        wc = next(self.__word_classifications)
        if wc["entity_group"] != "PER":
            raise RuntimeError("WithPosition decorator works only with entity type = 'PER'")
        wc["position"] = self.__llm_qa.ask(self.__query.format(person=wc["word"], context=wc["source"]))
        return wc
