from pathlib import Path

from prompt.abc_ import Prompt


class FileSystemPrompt(Prompt):
    def __init__(self, filepath: Path) -> None:
        if not filepath.is_file():
            raise ValueError(f"{str(filepath)} is not file.")
        self.__filepath = filepath

    def get(self) -> str:
        with open(self.__filepath, "r") as fd:
            prompt = fd.read()

        return prompt

    def update(self, new_prompt: str) -> str:
        with open(self.__filepath, "w") as fd:
            fd.write(new_prompt)

        return new_prompt

    def get_and_compile(self, **kwargs) -> str:
        return self.compile(self.get(), **kwargs)

    def compile(self, prompt: str, **kwargs) -> str:
        return prompt.format(**kwargs)
