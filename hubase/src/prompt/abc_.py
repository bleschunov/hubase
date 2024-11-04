import abc


class Prompt(abc.ABC):
    @abc.abstractmethod
    def get(self) -> str:
        raise NotImplementedError()

    @abc.abstractmethod
    def update(self, new_prompt: str) -> str:
        raise NotImplementedError()

    @abc.abstractmethod
    def get_and_compile(self, **kwargs) -> str:
        raise NotImplementedError()

    @abc.abstractmethod
    def compile(self, prompt: str, **kwargs) -> str:
        raise NotImplementedError()
