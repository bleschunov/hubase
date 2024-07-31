import typing as t

from word_classifications.abc_ import IWordClassifications


# TODO: move to decorators folder
class WithSource(IWordClassifications):
    def __init__(self, word_classifications: IWordClassifications) -> None:
        self.__word_classifications = word_classifications

    def __iter__(self) -> t.Iterator[dict]:
        iter(self.__word_classifications)
        return self

    def __next__(self) -> dict:
        wc = next(self.__word_classifications)
        start_pos = wc["start"] - 100
        end_pos = wc["end"] + 100
        wc["source"] = wc["original_text"][start_pos:end_pos].strip().replace("\n", " ").replace("\t", " ")
        return wc
