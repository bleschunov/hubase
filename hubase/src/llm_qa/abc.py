import abc


class LLMClientQA(abc.ABC):
    @abc.abstractmethod
    def ask(self, prompt: str) -> str:
        raise NotImplementedError
