import logging

import requests

from exceptions import HuggingFaceException
from hubase_md import HubaseMd
from settings import settings
from word_classifications.abc import IWordClassifications

logging.basicConfig(level=logging.INFO)


class WordClassifications(IWordClassifications):
    __api_url = "https://api-inference.huggingface.co/models/51la5/roberta-large-NER"
    __headers = {"Authorization": f"Bearer {settings.hugging_face_token}"}

    def __init__(self, page: HubaseMd, batch_size: int = 514) -> None:
        self.__page = page
        self.__text_batches = self.__split_text(text=page.md, batch_size=batch_size)
        self.__word_classifications: list[dict] = []
        self.__current_batch_i = 0

    def __iter__(self):
        return self

    def __next__(self) -> dict:
        while len(self.__word_classifications) == 0:
            if self.__current_batch_i >= len(self.__text_batches):
                raise StopIteration()

            current_batch = self.__text_batches[self.__current_batch_i]
            self.__current_batch_i += 1

            logging.info(f"Делаем запрос в NER. Батч {self.__current_batch_i}/{len(self.__text_batches)}")
            raw_word_classifications = self.__call_huggingface_or_raise(
                self.__api_url,
                self.__headers,
                {"inputs": current_batch, "options": {"wait_for_model": True}}
            )

            for wc in raw_word_classifications:
                wc["original_text"] = current_batch

            self.__word_classifications.extend(raw_word_classifications)

        return self.__word_classifications.pop(0)

    def __split_text(self, text: str, batch_size: int) -> list[str]:
        batches = []
        for i in range(0, len(text), batch_size):
            batches.append(text[i:i + batch_size])
        return batches

    def __call_huggingface_or_raise(self, api_url: str, headers: dict, payload: dict) -> dict:
        response = requests.post(
            api_url,
            headers=headers,
            json=payload,
        ).json()

        if "error" in response:
            logging.warning(f"HuggingFace error. {response['error']}")
            raise HuggingFaceException(response['error'])

        return response


if __name__ == "__main__":
    for classification in WordClassifications("Дима работает в Apple и встречается с Катей"):
        print(classification)

