from dataclasses import dataclass


@dataclass(frozen=True)
class CSVRow:
    name: str
    source: str
    position: str
    searched_company: str
    inferenced_company: str
    original_url: str
