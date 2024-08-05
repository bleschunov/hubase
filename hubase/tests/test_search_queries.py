import unittest

from search_queries import SearchQueries


class TestSearchQueries(unittest.TestCase):
    __successfully_compiled_search_queries_params = [
        (
            "{company} AND {positions} AND {site}",
            ["Мосстрой"],
            ["Гендир", "Начальник"],
            ["rbc.ru", "cfo-russia.ru"],
            [
                '"Мосстрой" AND ("Гендир" OR "Начальник") AND site:rbc.ru',
                '"Мосстрой" AND ("Гендир" OR "Начальник") AND site:cfo-russia.ru',
            ]
        ),
        (
            "{company} AND {positions} AND {site}",
            ["Мосстрой"],
            ["Гендир", "Начальник"],
            [""],
            [
                '"Мосстрой" AND ("Гендир" OR "Начальник") AND ',
            ]
        ),
        (
            "{company} AND {positions} AND {site}",
            ["Мосстрой"],
            [],
            ["rbc.ru"],
            [
                '"Мосстрой" AND () AND site:rbc.ru',
            ]
        ),
        (
            "{positions} AND {site}",
            ["Мосстрой"],
            ["Гендир", "Начальник"],
            ["rbc.ru"],
            [
                '("Гендир" OR "Начальник") AND site:rbc.ru',
            ]
        ),
        (
            "{site} AND {positions} AND {company}",
            ["Мосстрой"],
            ["Гендир", "Начальник"],
            ["rbc.ru"],
            [
                'site:rbc.ru AND ("Гендир" OR "Начальник") AND "Мосстрой"',
            ]
        ),
        (
            "{company} AND {position} AND {site}",
            ["Мосстрой"],
            ["Гендир", "Начальник"],
            ["rbc.ru", "cfo-russia.ru"],
            [
                '"Мосстрой" AND "Гендир" AND site:rbc.ru',
                '"Мосстрой" AND "Начальник" AND site:rbc.ru',
                '"Мосстрой" AND "Гендир" AND site:cfo-russia.ru',
                '"Мосстрой" AND "Начальник" AND site:cfo-russia.ru',
            ]
        ),
        (
            "{position} работает в {company} *",
            ["Мосстрой"],
            ["Гендир"],
            ["rbc.ru"],
            [
                '"Гендир" работает в "Мосстрой" *',
            ]
        ),
        (
            "{position} работает в {company} *",
            ["Мосстрой", "Север Минералс"],
            ["Гендир", "Начальник"],
            ["rbc.ru"],
            [
                '"Гендир" работает в "Мосстрой" *',
                '"Начальник" работает в "Мосстрой" *',
                '"Гендир" работает в "Север Минералс" *',
                '"Начальник" работает в "Север Минералс" *',
            ]
        ),
    ]

    __raise_exceptions_on_invalid_template_params = [
        "{company} AND {positions} AND {site} AND {position}",
        "{company} AND {positions} AND {site} AND {abracadabra}"
    ]

    def test_successfully_compiled_search_queries(self):
        for template, company, positions, sites, expected_queries in self.__successfully_compiled_search_queries_params:
            with self.subTest(
                    template=template,
                    company=company,
                    positions=positions,
                    sites=sites,
                    expected_queries=expected_queries
            ):
                compiled_queries = list(SearchQueries(template, company, positions, sites).compiled())
                self.assertListEqual(compiled_queries, expected_queries)

    def test_raise_exceptions_on_invalid_template(self):
        for invalid_template in self.__raise_exceptions_on_invalid_template_params:
            with self.subTest(template=invalid_template):
                with self.assertRaises(ValueError):
                    SearchQueries(template=invalid_template, companies=["test"], positions=["test"], sites=["test"])
