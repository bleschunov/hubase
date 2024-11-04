import csv
import datetime as dt
import typing as t

from model import CSVRow
from settings import Settings


class HubaseCsv:
    def __init__(self, headers: list[str], settings: Settings):
        self.__csv_name = (
            f"result-{dt.datetime.now().strftime('%m%d%Y-%H%M%S')}.csv"
        )
        self.__fd: t.IO | None = None
        self.__csv: csv.DictWriter | None = None
        self.__headers = headers
        self.__settings = settings

    def __enter__(self) -> "HubaseCsv":
        self.__fd = open(f"../results/{self.__csv_name}", mode="a+")
        self.__csv = csv.DictWriter(
            self.__fd, fieldnames=self.__headers, extrasaction="ignore"
        )
        self.__csv.writeheader()
        return self

    def __exit__(self, exc_type, exc_value, exc_tb) -> None:
        self.__fd.flush()
        self.__fd.close()

    def persist(self, person: CSVRow) -> None:
        self.__csv.writerow(person.__dict__)

    @property
    def download_url(self) -> str:
        return f"http://{self.__settings.download_host}:{self.__settings.port}/static/results/{self.__csv_name}"
