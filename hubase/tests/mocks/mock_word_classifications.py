class MockWordClassifications:
    def __init__(self):
        self.data = [
            {
                "name": "John Doe",
                "position": "Director",
                "searched_company": "Example Corp",
                "inferenced_company": "Example Corp",
                "original_url": "https://example.com/profile/johndoe",
                "source": "LinkedIn by John Doe",
            },
            {
                "name": "Jane Smith",
                "position": "CEO",
                "searched_company": "Tech Solutions",
                "inferenced_company": "Tech Solutions",
                "original_url": "https://example.com/profile/janesmith",
                "source": "Company Website by Jane Smith",
            },
        ]

    def get_mock_data(self):
        return self.data
