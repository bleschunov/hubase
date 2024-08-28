from dataclasses import dataclass


@dataclass(frozen=True)
class Person:
    name: str
    position: str
    searched_company: str
    inferenced_company: str
    original_url: str
    source: str
