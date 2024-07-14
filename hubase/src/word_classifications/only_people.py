from word_classifications.abc import IWordClassifications


class OnlyPeople(IWordClassifications):
    def __init__(self, word_classifications: IWordClassifications) -> None:
        self.__word_classifications = word_classifications

    def __iter__(self) -> "IWordClassifications":
        return self

    def __next__(self) -> dict:
        while True:
            wc = next(self.__word_classifications)
            if wc["entity_group"] == "PER":
                wc["name"] = wc["word"]
                return wc
