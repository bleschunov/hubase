import typing as t

from word_classifications.abc_ import IPeople


# TODO: move to decorators folder
class WithSource(IPeople):
    def __init__(self, word_classifications: IPeople) -> None:
        self.__word_classifications = word_classifications

    def __iter__(self) -> t.Iterator[dict]:
        iter(self.__word_classifications)
        return self

    def __next__(self) -> dict:
        wc = next(self.__word_classifications)

        start_pos = max(0, wc["start"] - 100)
        end_pos = min(len(wc["original_text"]), wc["end"] + 100)

        wc["source"] = wc["original_text"][start_pos:end_pos].strip().replace("\n", " ").replace("\t", " ")
        return wc



