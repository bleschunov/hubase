import abc

import requests


class LLMClientQA(abc.ABC):
    @abc.abstractmethod
    def ask(self, prompt: str) -> str:
        raise NotImplementedError
