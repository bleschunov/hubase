from dataclasses import dataclass

from word_classifications.model import Person


@dataclass(frozen=True)
class CSVRow:
    person: Person
    position: str
    searched_company: str
    inferenced_company: str
    original_url: str
