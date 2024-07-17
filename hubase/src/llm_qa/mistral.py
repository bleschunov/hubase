import logging

from mistralai.client import MistralClient
from mistralai.models.chat_completion import ChatMessage

from llm_qa.abc import LLMClientQA
from settings import settings

logging.basicConfig(level=logging.INFO)


class LLMClientQAMistral(LLMClientQA):
    def __init__(self):
        self.__client = MistralClient(api_key=settings.mistral_api_key)
        self.__model = "mistral-large-latest"

    def ask(self, prompt) -> str:
        # logging.info(f"Итоговый промпт:\n{prompt}")
        logging.info(f"Делаем запрос в Mistral")
        response = self.__client.chat(model=self.__model, messages=[ChatMessage(role="user", content=prompt)])

        logging.info(f"Использовано токенов: {response.usage}")

        return response.choices[0].message.content