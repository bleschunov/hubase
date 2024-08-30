import abc
import typing as t

T = t.TypeVar("T")


class HubaseIterator(t.Generic[T], abc.ABC):
    @abc.abstractmethod
    def iter(self) -> t.Iterator[T]:
        raise NotImplementedError
