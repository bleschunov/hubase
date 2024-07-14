import logging

from hubase_csv import HubaseCsv
from hubase_md import HubaseMd
from llm_qa.mistral import LLMClientQAMistral
from search_page import SearchPage
from settings import settings
from word_classifications.only_people import OnlyPeople
from word_classifications.with_company import WithCompany
from word_classifications.with_position import WithPosition
from word_classifications.with_source import WithSource
from word_classifications.word_classifications import WordClassifications


logging.basicConfig(level=logging.INFO)


def get_names_and_positions_csv(companies: list[str], sites: list[str], positions: list[str]) -> str:
    headers = ["name", "position", "searched_company", "inferenced_company", "original_url", "source"]
    with HubaseCsv(headers=headers, settings=settings) as csv_:
        for url, searching_params in SearchPage(companies, positions, sites, url_limit=1):
            company_staff = (
                WithCompany(
                    LLMClientQAMistral(),
                    WithPosition(
                        LLMClientQAMistral(),
                        WithSource(
                            OnlyPeople(
                                WordClassifications(
                                    HubaseMd(url)
                                )
                            )
                        )
                    )
                )
            )
            for person in company_staff:
                person["original_url"] = url
                person["searched_company"] = searching_params["company"]
                csv_.persist(person)
        return csv_.download_url


if __name__ == "__main__":
    companies = [
        # "Север Минералс",
        # "ГК GloraX",
        # "ГК Seven Suns Development",
        # "ПИК",
        # "Setl Group",
        # "ГК ТОЧНО",
        # "Федеральный девелопер «Неометрия»",
        "Мосстрой",
        # "Capital Group",
        # "ЦДС"
    ]
    sites = [
        # "cfo-russia.ru",
        # "companies.rbc.ru"
        "sbis.ru"
    ]
    positions = [
        "директор",
        "руководитель",
        "начальник",
        "глава",
    ]
    get_names_and_positions_csv(companies, sites, positions)
