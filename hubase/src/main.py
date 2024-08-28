import logging
import typing as t
from logging import Logger

from api.model import CsvOptions
from hubase_csv import HubaseCsv
from hubase_md import HubaseMd, JinaException
from model import Person
from search_page import SearchPage
from search_queries import SearchQueries
from settings import settings
from word_classifications.word_classifications_with_gpt import WordClassificationsWithGPT


def _main(
    csv_options: CsvOptions,
    logger: Logger
) -> t.Iterator[Person]:
    search_queries = SearchQueries(
        csv_options.search_query_template,
        csv_options.companies,
        csv_options.positions,
        csv_options.sites
    )

    for url, searching_params in SearchPage(search_queries, logger, url_limit=5).found():
        try:
            md = HubaseMd(url, logger).md

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
            with open("../prompts/get_names_from_text.txt") as fd:
                prompt_template = fd.read()

            company_staff = WordClassificationsWithGPT(
                md,
                prompt_template,
                settings.openai_api_key,
                logger,
                batch_size=256,
            ).iter()

            while True:
                try:
                    wc = next(company_staff)
                except StopIteration:
                    break
                except Exception as err:
                    logger.warning("Непредвиденная ошибка: %s", err)
                    continue
                    # TODO: в этом месте ловить ошибки и пробрасывать кастомные наверх
                else:
                    yield Person(
                        name=wc.name,
                        position="-",
                        searched_company=searching_params["company"],
                        inferenced_company="-",
                        original_url=url,
                        source=wc.source,
                    )


def get_names_and_positions_csv(
    csv_options: CsvOptions,
    logger: Logger
) -> str:
    headers = ["name", "position", "searched_company", "inferenced_company", "original_url", "source"]
    with HubaseCsv(headers=headers, settings=settings) as csv_:
        for person in _main(csv_options, logger):
            csv_.persist(person)
    return csv_.download_url


def get_names_and_positions_csv_with_progress(
    csv_options: CsvOptions,
    logger: Logger
) -> t.Iterator[dict[str, str | int] | str]:
    headers = ["name", "position", "searched_company", "inferenced_company", "original_url", "source"]
    with HubaseCsv(headers=headers, settings=settings) as csv_:
        yield csv_.download_url
        for person in _main(csv_options, logger):
            csv_.persist(person)
            yield person

if __name__ == "__main__":
    logger = logging.getLogger(__name__)
    search_template = "{company} AND {positions} AND {site}"
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
        # "ЦДС",
        # "Балтика"
    ]
    sites = [
        "cfo-russia.ru",
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

    csv_options = CsvOptions(
        companies=companies,
        sites=sites,
        positions=positions,
        search_query_template=search_template,
        access_token="",
        company_prompt="",
        position_prompt="",
    )

    get_names_and_positions_csv(csv_options, logger)
