import unittest
from unittest.mock import patch, MagicMock, create_autospec, PropertyMock

import requests

from hubase_md import HubaseMd, JinaException


def get_jina_success_md():
    with open("./data/jina_success_md.txt") as fd:
        return fd.read()


def get_jina_error():
    with open("./data/jina_error.txt") as fd:
        return fd.read()


jina_success_md = get_jina_success_md()
jina_error = get_jina_error()


class TestHubaseMd(unittest.TestCase):
    @patch.object(requests.Response, "text", new_callable=PropertyMock, return_value=jina_success_md)
    @patch.object(requests, "get", return_value=requests.Response())
    def test_jina_return_md(self, *_) -> None:
        hubase_md = HubaseMd(url=MagicMock())
        md = hubase_md.md
        self.assertEqual(jina_success_md, md)

    @patch.object(requests.Response, "text", new_callable=PropertyMock, return_value=jina_error)
    @patch.object(requests, "get", return_value=requests.Response())
    def test_jina_return_md(self, *_) -> None:
        with self.assertRaises(JinaException):
            _ = HubaseMd(url=MagicMock()).md
