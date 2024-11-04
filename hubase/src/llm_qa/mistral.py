from logging import Logger

from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage

from llm_qa.abc import LLMClientQA
from settings import settings


class LLMClientQAMistral(LLMClientQA):
    def __init__(self, logger: Logger):
        self.__client = MistralClient(api_key=settings.mistral_api_key)
        self.__model = "mistral-large-latest"
        self.__logger = logger

    def ask(self, prompt: str) -> str:
        short_prompt = prompt[:97].replace("\n", " ") + "..."
        self.__logger.info(f"Итоговый промпт: {short_prompt}")
        self.__logger.info("Делаем запрос в Mistral")

        response = self.__client.chat(
            model=self.__model,
            messages=[ChatMessage(role="user", content=prompt)],
        )

        self.__logger.info(f"Использовано токенов: {response.usage}")

        return response.choices[0].message.content
