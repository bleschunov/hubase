import csv
import typing as t
import datetime as dt

from settings import Settings


class HubaseCsv:
    def __init__(self, headers: list[str], settings: Settings):
        self.__csv_name = f"result-{dt.datetime.now().strftime('%m%d%Y-%H%M%S')}.csv"
        self.__fd: t.IO | None = None
        self.__csv: csv.DictWriter | None = None
        self.__headers = headers
        self.__settings = settings

    def __enter__(self) -> "HubaseCsv":
        self.__fd = open(f"../results/{self.__csv_name}", mode='a+')
        self.__csv = csv.DictWriter(self.__fd, fieldnames=self.__headers, extrasaction="ignore")
        self.__csv.writeheader()
        return self

    def __exit__(self, exc_type, exc_value, exc_tb) -> None:
        self.__fd.flush()
        self.__fd.close()

    def persist(self, row: dict) -> None:
        for header in self.__headers:
            if header not in row:
                row[header] = "-"
                # raise RuntimeError(f"Строка не содержит поля: {header}")
        self.__csv.writerow(row)

    @property
    def download_url(self) -> str:
        return f"http://{self.__settings.download_host}:{self.__settings.port}/static/results/{self.__csv_name}"
