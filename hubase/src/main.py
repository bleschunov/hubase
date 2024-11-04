import typing as t
from logging import Logger

from api.model import CsvOptions
from hubase_csv import HubaseCsv
from hubase_md import HubaseMd, JinaException
from model import CSVRow
from search_page import SearchPage
from search_queries import SearchQueries
from settings import settings
from word_classifications.gpt.csv_rows import GPTCSVRows
from word_classifications.gpt.people import GPTPeople


def _main(
    csv_options: CsvOptions,
    logger: Logger
) -> t.Iterator[CSVRow]:
    search_queries = SearchQueries(
        csv_options.search_query_template,
        csv_options.companies,
        csv_options.positions,
        csv_options.sites,
        csv_options.excluded_sites_lists,
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
            continue

        with open("../prompts/get_people_from_text_short.txt") as fd:
            prompt_template = fd.read()

        if csv_options.openai_api_key.get_secret_value() != "":
            openai_api_key = csv_options.openai_api_key
        else:
            openai_api_key = settings.openai_api_key

        openai_api_base = csv_options.openai_api_base if csv_options.openai_api_base != "" else settings.openai_api_base

        yield from GPTCSVRows(
            people=GPTPeople(
                text=md,
                prompt_template=prompt_template,
                api_key=openai_api_key.get_secret_value(),
                logger=logger,
                openai_api_base=openai_api_base,
                batch_size=512,
            ),
            url=url,
            searching_params=searching_params,
        ).iter()

        # yield from NerCSVRows(
        #     people=NerPeople(
        #         md,
        #         NerClient(settings.hugging_face_ner_api_url, settings.hugging_face_token, logger),
        #         logger,
        #         batch_size=512,
        #     ),
        #     llm_qa=LLMClientQAMistral(logger),
        #     company_prompt=InMemoryPrompt(csv_options.company_prompt),
        #     position_prompt=InMemoryPrompt(csv_options.position_prompt),
        #     url=url,
        #     searching_params=searching_params,
        # ).iter()


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
) -> t.Iterator[CSVRow | str]:
    headers = ["name", "position", "searched_company", "inferenced_company", "original_url", "source"]

    with HubaseCsv(headers=headers, settings=settings) as csv_:
        yield csv_.download_url

        for lead_count, person in enumerate(_main(csv_options, logger), start=1):
            csv_.persist(person)
            yield person

            if lead_count >= csv_options.max_lead_count:
                break
