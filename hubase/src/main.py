import abc
import copy
import csv
import datetime as dt
import json
import logging
from http.client import HTTPException

import requests
from googlesearch import search
from mistralai.client import MistralClient
from mistralai.exceptions import MistralAPIException
from mistralai.models.chat_completion import ChatMessage
from tenacity import stop_after_attempt, retry, wait_exponential

from settings import settings

company_name = '"{}"'
site = 'site:{}'
positions = '("директор" OR "директор ГК ССК" OR "руководитель" OR "начальник" OR "глава")'
google_query_with_site = " AND ".join([company_name, site, positions])
google_query = " AND ".join([company_name, positions])
jina_query = "https://r.jina.ai/{}"
llm_query_for_long_context = """Выведи имена и должности людей, работающих в компании {}. Если ты не уверен, что человек работает в этой компании, то выводить его не нужно. 

Ты должен вернуть ответ в JSON формате строго с полями: name, position. 
Пример ответа: {{"results": [{{"name": "Иван"}}, {{"position": "Продавец"}}]}}.

{}
"""
llm_query_for_short_context = """В какой компании работает {}? В ответе напиши только название компании. 
Если в тексте нет информации для ответа на вопрос, просто скажи None.


{}
"""

logging.basicConfig(level=logging.INFO)


@retry(stop=stop_after_attempt(4), wait=wait_exponential(multiplier=1, min=4, max=30))
def call_huggingface_with_retry(api_url: str, headers: dict, payload: dict) -> dict:
    response = requests.post(
        api_url,
        headers=headers,
        json=payload,
    ).json()

    if "error" in response:
        logging.warning(f"HuggingFace error. {response['error']}")
        raise HTTPException(response["error"])

    return response


class LLMClientQA(abc.ABC):
    def __init__(self, template: str, context: str):
        self._template = template
        self._context = context

    @abc.abstractmethod
    def ask(self, *params: str) -> str:
        raise NotImplementedError


class LLMClientQAMistral(LLMClientQA):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__client = MistralClient(api_key=settings.mistral_api_key)
        self.__model = "mistral-large-latest"

    def ask(self, *params: str) -> str:
        prompt = self._template.format(*params, self._context)
        logging.info(f"Итоговый промпт:\n{prompt}")
        response = self.__client.chat(
            model=self.__model,
            messages=[ChatMessage(role="user", content=prompt)]
        )

        logging.info(f"Использовано токенов: {response.usage}")

        return response.choices[0].message.content


class LLMClientQANer(LLMClientQA):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__api_url = "https://api-inference.huggingface.co/models/AlexKay/xlm-roberta-large-qa-multilingual-finedtuned-ru"
        self.__headers = {"Authorization": f"Bearer {settings.hugging_face_token}"}
        self.__payload = {"inputs": {"context": self._context}}

    def ask(self, *params: str) -> str:
        response = call_huggingface_with_retry(
            self.__api_url,
            self.__headers,
            self.__payload_with_question(self._template.format(*params))
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


def get_url(company: str, site: str) -> str:
    logging.info(f"Поиск для компании: {company}")
    if site != "":
        query = google_query_with_site.format(company, site)
    else:
        query = google_query.format(company)
    logging.info(f"Делаем запрос: {query}")
    return next(search(query, stop=1))


def get_md(url: str) -> str:
    logging.info(f"Строим Markdown для сайта: {url}")
    query = jina_query.format(url)
    logging.info(f"Делаем запрос: {query}")
    return requests.get(url=query, headers={
        "X-Return-Format": "text"
    }).text


def get_md_batches(md: str, batch_size: int) -> list[str]:
    results = []
    for i in range(0, len(md), batch_size):
        results.append(md[i:i + batch_size])
    return results


def get_answer_mistral(company: str, md: str) -> str:
    # api_key = os.environ["MISTRAL_API_KEY"]
    model = "mistral-large-latest"
    client = MistralClient(api_key=settings.mistral_api_key)

    response = client.chat(
        model=model,
        response_format={"type": "json_object"},
        messages=[ChatMessage(role="user", content=llm_query_for_long_context.format(company, md))]
    )

    logging.info(f"Использовано токенов: {response.usage}")

    return response.choices[0].message.content


def get_answer_ner(md_batches: list[str]) -> list[dict]:
    API_URL = "https://api-inference.huggingface.co/models/51la5/roberta-large-NER"
    # if (api_key := os.environ.get("HUGGING_FACE_TOKEN")) is None:
    #     raise ValueError("HUGGING_FACE_TOKEN is mandatory in env!")
    headers = {"Authorization": f"Bearer {settings.hugging_face_token}"}

    results = []
    for i, batch in enumerate(md_batches, start=1):
        logging.info(f"Делаем запрос в NER. Батч: {i}/{len(md_batches)}")
        choices = call_huggingface_with_retry(API_URL, headers, {"inputs": batch})

        for choice in choices:
            start_pos = choice["start"] - 100
            end_pos = choice["end"] + 100
            choice["source"] = batch[start_pos:end_pos].strip().replace("\n", " ").replace("\t", " ")
        results.extend(choices)

    return results


def extend_with_company_name_and_position_from_source(choices: list[dict]) -> list[dict]:
    for choice in choices:
        if len(choice["source"]) == 0:
            continue

        company_query = """В какой компании работает {}? В ответе напиши только название компании. 
Если в тексте нет информации для ответа на вопрос, просто скажи None.

{}"""
        llm_company = LLMClientQAMistral(company_query, choice["source"])
        position_query = """Какую должность занимает {}? В ответе напиши только название должности. 
Если в тексте нет информации для ответа на вопрос, просто скажи None.

{}"""
        llm_position = LLMClientQAMistral(position_query, choice["source"])

        response = None
        try:
            choice["inferenced_company"] = llm_company.ask(choice["name"])
            choice["position"] = llm_position.ask(choice["name"])
        except KeyError as err:
            logging.warning(response, exc_info=err)

    return choices


def decode_json(json_data: str) -> list[dict]:
    try:
        data = json.loads(json_data)
        return data["results"]
    except (ValueError, KeyError):
        return [{"name": json_data, "position": ""}]


def decode_ner(choices: list[dict], company: str, link: str) -> list[dict]:
    ner_choices = filter(lambda x: x["entity_group"] == "PER", choices)

    results = []
    for choice in ner_choices:
        results.append({
            "name": choice["word"],
            "position": "-",
            "searched_company": company,
            # "link": f"{link}#:~:text={choice['source']}",
            "link": link,
            "source": choice["source"]
        })

    return results


def extend_json(data: list[dict], company: str, link: str) -> list[dict]:
    for d in data:
        d["company"] = company
        d["link"] = link
    return data


def export_to_csv(writer: csv.DictWriter, data: list[dict]):
    writer.writerows(data)


def get_names_and_positions_csv(companies: list[str], sites: list[str]) -> str:
    download_link = f"result-{dt.datetime.now().strftime('%m%d%Y-%H%M%S')}.csv"
    with open(f"../results/{download_link}", mode='a+') as fd:
        fieldnames = ["name", "position", "searched_company", "inferenced_company", "link", "source"]
        writer = csv.DictWriter(fd, fieldnames=fieldnames)
        writer.writeheader()

        for company in companies:
            for site in sites:
                try:
                    url = get_url(company, site)
                    answers = extend_with_company_name_and_position_from_source(
                        decode_ner(
                            get_answer_ner(
                                get_md_batches(
                                    get_md(url),
                                    514,
                                ),
                            ),
                            company,
                            url,
                        )
                    )
                    logging.info(f"Найдено людей: {len(answers)}")
                    export_to_csv(writer, answers)
                    fd.flush()
                except StopIteration:
                    logging.warning(f"Не смогли найти упоминания компании {company} на cfo-russia.ru")
                except MistralAPIException as err:
                    logging.exception(err)
    return download_link


def get_urls(companies: list[str], sites: list[str]):
    all_urls = []
    for company in companies:
        for site in sites:
            try:
                all_urls.append(get_url(company, site))
            except StopIteration:
                logging.warning(f"Не смогли найти упоминания компании {company} на {site}")
    logging.info(f"Нашли ссылки: {all_urls}")


if __name__ == "__main__":
    companies = [
        "Север Минералс",
        # "ГК GloraX",
        # "ГК Seven Suns Development",
        # "ПИК",
        # "Setl Group",
        # "ГК ТОЧНО",
        # "Федеральный девелопер «Неометрия»",
        # "Мосстрой",
        # "Capital Group",
        # "ЦДС"
    ]
    sites = [
        "cfo-russia.ru",
        # "companies.rbc.ru"
    ]
    get_names_and_positions_csv(companies, sites)
