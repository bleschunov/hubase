import unittest
from unittest.mock import MagicMock, patch, PropertyMock

from hubase_md import HubaseMd, JinaException
from main import _main
from search_page import SearchPage


jina_exception = JinaException("testexcmsg")


class TestIntegration(unittest.TestCase):
    @patch.object(
        SearchPage,
        "__next__",
        return_value=("testurl/sub", {"company": "testcompany", "site": "testurl", "positions": ["testpositions"]})
    )
    @patch.object(HubaseMd, "md", new_callable=PropertyMock, side_effect=jina_exception)
    def test_yield_error_row_on_jina_exception(self, *_):
        row = next(_main(companies=["testcompany"], sites=["testurl"], positions=["testpositions"]))
        self.assertDictEqual(
            {
                "name": jina_exception,
                "position": None,
                "searched_company": "testcompany",
                "inferenced_company": None,
                "original_url": "testurl/sub",
                "source": None,
            },
            row
        )
