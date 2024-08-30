from dataclasses import dataclass


@dataclass(frozen=True)
class Person:
    name: str
    source: str
