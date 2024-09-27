import typing as t
from dataclasses import dataclass
from logging import Logger

from openai import OpenAI
from pydantic import BaseModel

from word_classifications.abc_ import HubaseIterator


class GPTPerson(BaseModel):
    name: str
    company: str
    position: str


class GPTResponse(BaseModel):
    people: list[GPTPerson]


@dataclass
class GPTResponseWithSource:
    person: GPTPerson
    source: str


class GPTPeople(HubaseIterator):
    def __init__(
        self,
        text: str,
        prompt_template: str,
        api_key: str,
        logger: Logger,
        *,
        batch_size: int = 2000,
        openai_api_base: str | None = None,
        mode: str,
        site_name: str
    ) -> None:
        if "{input}" not in prompt_template:
            raise ValueError("Переменная {input} должна быть в промпте.")

        self.__text = text
        self.__prompt_template = prompt_template
        self.__api_key = api_key
        self.__client = OpenAI(api_key=self.__api_key)
        self.__logger = logger
        self.__batch_size = batch_size
        self.__mode = mode
        self.__site_name = site_name

        if openai_api_base is not None:
            self.__client.base_url = openai_api_base

    def iter(self) -> t.Iterator[GPTResponseWithSource]:
        for batch in self.__text_batches():
            for person in self.__safely_call_gpt(self.__prompt_template.format(input=batch)):
                yield GPTResponseWithSource(
                    person=person,
                    source=batch,
                )
                if self.__mode == "researcher":
                    found_leads = True
                    break

            if found_leads and self.__mode == "researcher":
                break

    def __text_batches(self) -> t.Iterator[str]:
        for i in range(0, len(self.__text), self.__batch_size):
            yield self.__text[i:i + self.__batch_size]

    def __safely_call_gpt(self, prompt: str) -> list[GPTPerson]:
        try:
            response = self.__client.beta.chat.completions.parse(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                temperature=0,
                response_format=GPTResponse
            )

        except Exception as e:
            self.__logger.warning(f"Ошибка при запросе к GPT: {str(e)}")
            raise e

        else:
            people = response.choices[0].message.parsed.people
            self.__logger.info(f"Получен ответ от GPT.")
            self.__logger.info(f"Найдено людей: {len(people)}")
            self.__logger.info(f"Использовано токенов: {response.usage.total_tokens}")
            return response.choices[0].message.parsed.people

