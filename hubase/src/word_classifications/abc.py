import abc


class IWordClassifications(abc.ABC):
    def __iter__(self) -> "IWordClassifications":
        raise NotImplementedError

    def __next__(self) -> dict:
        raise NotImplementedError
