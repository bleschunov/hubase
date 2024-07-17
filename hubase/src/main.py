import logging
import typing as t

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

def __main(
    companies: list[str],
    sites: list[str],
    positions: list[str]
) -> t.Iterable[dict[str, str | int]]:
    for url, searching_params in SearchPage(companies, positions, sites, url_limit=5):
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
            yield person


def get_names_and_positions_csv(
    companies: list[str],
    sites: list[str],
    positions: list[str]
) -> str:
    headers = ["name", "position", "searched_company", "inferenced_company", "original_url", "source"]
    with HubaseCsv(headers=headers, settings=settings) as csv_:
        for person in __main(companies, sites, positions):
            csv_.persist(person)
    return csv_.download_url


def get_names_and_positions_csv_with_progress(
    companies: list[str],
    sites: list[str],
    positions: list[str]
) -> t.Iterator[dict[str, str | int] | str]:
    headers = ["name", "position", "searched_company", "inferenced_company", "original_url", "source"]
    with HubaseCsv(headers=headers, settings=settings) as csv_:
        yield csv_.download_url
        for person in __main(companies, sites, positions):
            csv_.persist(person)
            yield person


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
