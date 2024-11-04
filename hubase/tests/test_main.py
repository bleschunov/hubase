import unittest

from src.main import decode_json


class TestAbsFunction(unittest.TestCase):
    def test_decode_json_success(self):
        test_data = """{"results": [
            {"name": "Наталия Черкасова", "position": "Директор по корпоративным финансам"},
            {"name": "Боб Дилан", "position": "Директор"}
        ]}"""
        expected_result = [
            {
                "name": "Наталия Черкасова",
                "position": "Директор по корпоративным финансам",
            },
            {"name": "Боб Дилан", "position": "Директор"},
        ]

        actual_result = decode_json(test_data)

        self.assertListEqual(actual_result, expected_result)

    def test_decode_json_fail(self):
        test_data = "not json"
        expected_result = [{"name": test_data, "position": ""}]

        actual_result = decode_json(test_data)

        self.assertListEqual(actual_result, expected_result)

    # def test_export_to_csv(self):
    #     test_data = [
    #         {"name": "Наталия Черкасова", "position": "Директор по корпоративным финансам", "company": "Glorax"},
    #         {"name": "Боб Дилан", "position": "Директор", "company": "Гаваи"}
    #     ]
    #     export_to_csv(test_data)
