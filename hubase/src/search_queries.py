import logging
import typing as t
import re
import dataclasses


logging.basicConfig(level=logging.INFO)


@dataclasses.dataclass(frozen=True)
class SearchQuery:
    query: str
    search_params: dict[str, str]


class SearchQueries:
    __allowed_variables = {"{company}", "{site}", "{positions}", "{position}"}

    def __init__(self, template: str, companies: list[str], positions: list[str], sites: list[str],
                 excluded_sites_lists: list[str]) -> None:
        self.__template = template
        self.__companies = companies
        self.__positions = positions
        self.__sites = sites if len(sites) > 0 else [""]

        self.__is_plural_pos_in = "{positions}" in self.__template
        self.__is_singular_pos_in = "{position}" in self.__template

        self.__validate_template()
        self.__excluded_sites_lists = excluded_sites_lists

        if self.__is_plural_pos_in:
            self.__position_variable = "positions"
        else:
            self.__position_variable = "position"

    def __get_exclusion_sites(self) -> list[str]:
        excluded = []

        for name in self.__excluded_sites_lists:
            with open(f"../sites/{name}.txt", "r") as file:
                excluded.extend(file.readlines())

        return excluded

    def compiled(self) -> t.Iterator[SearchQuery]:
        exclusion_sites = self.__get_exclusion_sites()
        positions_ = self.__build_positions_list()
        for company in self.__companies:
            logging.info(f"Поиск для компании: {company}")
            for site in self.__sites:
                for position in positions_:
                    exclusion_query = " ".join([f"-site:{site}" for site in exclusion_sites])
                    search_params = {
                        "company": company,
                        "site": f'site:{site} {exclusion_query}' if site != "" else exclusion_query,
                        self.__position_variable: position
                    }
                    yield SearchQuery(
                        query=self.__template.format(**search_params),
                        search_params=search_params
                    )

    def __validate_template(self) -> None:
        variables = set(re.findall("{.+?}", self.__template))
        prohibited_variables = variables - self.__allowed_variables

        if len(prohibited_variables) != 0:
            raise ValueError(
                f"В шаблоне поискового запроса запрещённые переменные: {', '.join(prohibited_variables)}. "
                f"Разрешённые переменные: {', '.join(self.__allowed_variables)}",
            )

        if self.__is_plural_pos_in and self.__is_singular_pos_in:
            raise ValueError(
                f"{{positions}} и {{position}} не могут быть одновременно. "
                f"Разрешённые переменные: {', '.join(self.__allowed_variables)}"
            )

    def __build_positions_list(self) -> list[str]:
        if self.__is_plural_pos_in:
            positions_ = " OR ".join(self.__positions)
            return [f"({positions_})"]
        else:
            return self.__positions
