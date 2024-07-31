import typing as t

from prompt.abc_ import Prompt


# TODO: move to decorators folder
class Cached(Prompt):
    def __init__(self, inner: Prompt) -> None:
        self.__inner = inner
        self.__prompt_text: t.Optional[str] = None

    def get(self) -> str:
        if self.__prompt_text is not None:
            return self.__prompt_text

        return self.__inner.get()

    def update(self, new_prompt: str) -> str:
        self.__inner.update(new_prompt)
        self.__prompt_text = new_prompt
        return new_prompt

    def get_and_compile(self, **kwargs) -> str:
        return self.__inner.compile(self.get(), **kwargs)

    def compile(self, prompt: str, **kwargs) -> str:
        return self.__inner.compile(prompt, **kwargs)
