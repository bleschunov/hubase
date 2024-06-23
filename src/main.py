import csv
import os
import logging
import json
import datetime as dt
from mistralai.client import MistralClient
from mistralai.exceptions import MistralAPIException
from mistralai.models.chat_completion import ChatMessage

import requests

from googlesearch import search

company_name = '"{}"'
site = 'site:{}'
positions = '("директор" OR "директор ГК ССК" OR "руководитель" OR "начальник" OR "глава")'
google_query_with_site = " AND ".join([company_name, site, positions])
google_query = " AND ".join([company_name, positions])
jina_query = "https://r.jina.ai/{}"
llm_query = """Выведи имена и должности людей, работающих в компании {}. Если ты не уверен, что человек работает в этой компании, то выводить его не нужно. 

Ты должен вернуть ответ в JSON формате строго с полями: name, position. 
Пример ответа: {{"results": [{{"name": "Иван"}}, {{"position": "Продавец"}}]}}.

{}
"""

logging.basicConfig(level=logging.INFO)


def get_url(company: str, site: str | None = None) -> str:
    logging.info(f"Поиск для компании: {company}")
    if site is not None:
        query = google_query_with_site.format(company, site)
    else:
        query = google_query.format(company)
    logging.info(f"Делаем запрос: {query}")
    return next(search(query, stop=1))


def get_md(url: str) -> str:
    logging.info(f"Строим Markdown для сайта: {url}")
    query = jina_query.format(url)
    logging.info(f"Делаем запрос: {query}")
    return requests.get(url=query).text


def get_answer(company: str, md: str) -> str:
    api_key = os.environ["MISTRAL_API_KEY"]
    model = "mistral-large-latest"
    client = MistralClient(api_key=api_key)

    response = client.chat(
        model=model,
        response_format={"type": "json_object"},
        messages=[ChatMessage(role="user", content=llm_query.format(company, md))]
    )

    logging.info(f"Использовано токенов: {response.usage}")

    return response.choices[0].message.content


def decode_json(json_data: str) -> list[dict]:
    try:
        data = json.loads(json_data)
        return data["results"]
    except (ValueError, KeyError):
        return [{"name": json_data, "position": ""}]


def extend_json(data: list[dict], company: str, link: str) -> list[dict]:
    for d in data:
        d["company"] = company
        d["link"] = link
    return data


def export_to_csv(writer: csv.DictWriter, data: list[dict]):
    writer.writerows(data)


def get_names_and_positions_csv(companies: list[str], sites: list[str]):
    with open(f"./results/result-{dt.datetime.now().strftime('%m%d%Y-%H%M%S')}.csv", mode='a+') as fd:
        fieldnames = ["name", "position", "company", "link"]
        writer = csv.DictWriter(fd, fieldnames=fieldnames)
        writer.writeheader()

        for company in companies:
            for site in sites:
                try:
                    url = get_url(company, site)
                    answers = extend_json(
                        decode_json(
                            get_answer(
                                company,
                                get_md(url)
                            ),
                        ),
                        company,
                        url
                    )
                    export_to_csv(writer, answers)
                    fd.flush()
                except StopIteration:
                    logging.warning(f"Не смогли найти упоминания компании {company} на cfo-russia.ru")
                except MistralAPIException as err:
                    logging.exception(err)


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
        "ГК GloraX",
        "ГК Seven Suns Development",
        "ПИК",
        "Setl Group",
        "ГК ТОЧНО",
        "Федеральный девелопер «Неометрия»",
        "Capital Group",
        "ЦДС"
    ]
    sites = [
        None,
        "cfo-russia.ru",
        "companies.rbc.ru"
    ]
    get_names_and_positions_csv(companies, sites)
