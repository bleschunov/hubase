from prompt.abc_ import Prompt


class InMemoryPrompt(Prompt):
    def __init__(self, prompt) -> None:
        self.__prompt = prompt

    def get(self) -> str:
        return self.__prompt

    def update(self, new_prompt: str) -> str:
        self.__prompt = new_prompt
        return new_prompt

    def get_and_compile(self, **kwargs) -> str:
        return self.compile(self.get(), **kwargs)

    def compile(self, prompt: str, **kwargs) -> str:
        return prompt.format(**kwargs)
