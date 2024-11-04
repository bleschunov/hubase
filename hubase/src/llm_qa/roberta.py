class LLMClientQARoberta(LLMClientQA):
    def __init__(self):
        self.__api_url = "https://api-inference.huggingface.co/models/AlexKay/xlm-roberta-large-qa-multilingual-finedtuned-ru"
        self.__headers = {
            "Authorization": f"Bearer {settings.hugging_face_token}"
        }
        self.__payload = {
            "inputs": {"context": self._context},
            "options": {"wait_for_model": True},
        }

    def ask(self, *params: str) -> str:
        response = self.__call_huggingface_or_raise(
            self.__api_url,
            self.__headers,
            self.__payload_with_question(self._template.format(*params)),
        )

        try:
            response = response["answer"]
        except KeyError as err:
            logging.warning(response, exc_info=err)

        return response

    def __payload_with_question(self, question: str) -> dict:
        payload = copy.deepcopy(self.__payload)
        payload["inputs"]["question"] = question
        return payload

    def __call_huggingface_or_raise(
        self, api_url: str, headers: dict, payload: dict
    ) -> dict:
        response = requests.post(
            api_url,
            headers=headers,
            json=payload,
        ).json()

        if "error" in response:
            logging.warning(f"HuggingFace error. {response['error']}")
            raise HuggingFaceException(response["error"])

        return response
