import logging
import typing as t

from hubase_csv import HubaseCsv
from hubase_md import HubaseMd, JinaException
from llm_qa.mistral import LLMClientQAMistral
from search_page import SearchPage
from settings import settings
from word_classifications.only_people import OnlyPeople
from word_classifications.with_company import WithCompany
from word_classifications.with_position import WithPosition
from word_classifications.with_source import WithSource
from word_classifications.word_classifications import WordClassifications


logging.basicConfig(level=logging.INFO)


def _main(
    companies: list[str],
    sites: list[str],
    positions: list[str]
) -> t.Iterator[dict[str, str | int]]:
    for url, searching_params in SearchPage(companies, positions, sites, url_limit=5):
        try:
            md = HubaseMd(url).md
        except JinaException as err:
            yield {
                "name": err,
                "position": None,
                "searched_company": searching_params["company"],
                "inferenced_company": None,
                "original_url": url,
                "source": None,
            }
        else:
            company_staff = (
                WithCompany(
                    LLMClientQAMistral(),
                    WithPosition(
                        LLMClientQAMistral(),
                        WithSource(
                            OnlyPeople(
                                WordClassifications(md)
                            )
                        )
                    )
                )
            )
            company_staff_iter = iter(company_staff)
            while True:
                try:
                    person = next(company_staff_iter)
                except StopIteration:
                    break
                except Exception as err:
                    logging.warning(f"Непредвиденная ошибка {err}")
                    continue
                    # TODO: в этом месте ловить ошибки и пробрасывать кастомные наверх
                else:
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
        for person in _main(companies, sites, positions):
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
        for person in _main(companies, sites, positions):
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
        # "Мосстрой",
        # "Capital Group",
        # "ЦДС",
        "Балтика"
    ]
    sites = [
        # "cfo-russia.ru",
        # "companies.rbc.ru"
    ]
    positions = [
        # "директор",
        # "руководитель",
        # "начальник",
        # "глава",
        "Директор по цифровой трансформации",
        "Финансовый директор"
    ]
    get_names_and_positions_csv(companies, sites, positions)
