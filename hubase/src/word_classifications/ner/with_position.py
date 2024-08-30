import typing as t

from llm_qa.abc import LLMClientQA
from prompt.abc_ import Prompt
from word_classifications.abc_ import IPeople


# TODO: move to decorators folder
class WithPosition(IPeople):
    def __init__(self, llm_qa: LLMClientQA, prompt: Prompt, inner: IPeople) -> None:
        self.__inner = inner
        self.__llm_qa = llm_qa
        self.__prompt = prompt

    def __iter__(self) -> t.Iterator[dict]:
        iter(self.__inner)
        return self

    def __next__(self) -> dict:
        wc = next(self.__inner)
        if wc["entity_group"] != "PER":
            raise RuntimeError("WithPosition decorator works only with entity type = 'PER'")
        wc["position"] = self.__llm_qa.ask(self.__prompt.get_and_compile(person=wc["word"], context=wc["source"]))
        return wc
