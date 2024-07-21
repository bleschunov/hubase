import abc
import typing as t


class IWordClassifications(abc.ABC):
    def __iter__(self) -> t.Iterator[dict]:
        raise NotImplementedError

    def __next__(self) -> dict:
        raise NotImplementedError
