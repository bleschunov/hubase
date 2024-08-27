from logging import Logger
import typing as t
import openai
import json
from settings import settings
from word_classifications.abc_ import IWordClassifications


class WordClassificationsWithGPT(IWordClassifications):
    __api_key = settings.openai_api_key

    def __init__(self, text: str, logger: Logger, batch_size: int = 2000) -> None:
        self.__text = text
        self.__batch_size = batch_size
        self.__text_batches = []
        self.__word_classifications: list[dict] = []
        self.__current_batch_i = 0
        self.__logger = logger
        openai.api_key = self.__api_key

    def __iter__(self) -> t.Iterator[dict]:
        self.__text_batches = self.__split_text(text=self.__text, batch_size=self.__batch_size)
        return self

    def __next__(self) -> dict:
        while len(self.__word_classifications) == 0:
            if self.__current_batch_i >= len(self.__text_batches):
                raise StopIteration()

            current_batch = self.__text_batches[self.__current_batch_i]
            self.__current_batch_i += 1

            self.__logger.info(f"Делаем запрос в GPT-4. Батч {self.__current_batch_i}/{len(self.__text_batches)}")
            raw_word_classifications = self.__call_gpt_or_raise(current_batch)

            for wc in raw_word_classifications:
                wc["original_text"] = current_batch

            self.__word_classifications.extend(raw_word_classifications)

        return self.__word_classifications.pop(0)

    def __split_text(self, text: str, batch_size: int) -> list[str]:
        batches = []
        for i in range(0, len(text), batch_size):
            batches.append(text[i:i + batch_size])
        return batches

    def __call_gpt_or_raise(self, text: str) -> t.List[dict]:
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {f"Проанализируй текст, и выдели из него Имена сотрудников компании."
                    f" Отвечай в формате JSON. Каждый элемент должен быть объектом со следующими полями: "
                    f"'name', 'position', 'searched_company', 'inferenced_company', 'original_url', 'source'."
                    f" Текст для анализа: '{text}'"}
                ],
                max_tokens=1000,
                temperature=0.1
            )

            content = response['choices'][0]['message']['content'].strip()
            self.__logger.info(f"Получен ответ от GPT-4: {content}")
            classifications = self.__parse_gpt_response(content)
            return classifications
        except Exception as e:
            self.__logger.warning(f"Ошибка при запросе к GPT-4: {str(e)}")
            raise e

    def __parse_gpt_response(self, response: str) -> t.List[dict]:
        response = response.strip()
        try:
            if not response:
                raise ValueError("Ответ пустой")

            if not (response.startswith('[') and response.endswith(']')):
                raise ValueError("Некорректный формат ответа от GPT-4")

            parsed_response = json.loads(response)
            if isinstance(parsed_response, list):
                return parsed_response
            else:
                raise ValueError("Некорректный формат ответа от GPT-4")
        except json.JSONDecodeError as e:
            self.__logger.error(f"Ошибка при разборе ответа от GPT-4: {str(e)}")
            raise e

if __name__ == "__main__":
    for classification in WordClassificationsWithGPT("Дима работает в Apple и встречается с Катей"):
        print(classification)
