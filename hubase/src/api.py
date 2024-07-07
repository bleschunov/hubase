from fastapi import FastAPI
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from main import get_names_and_positions_csv
from settings import settings

app = FastAPI()

origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount("/results", StaticFiles(directory="../results"), name="results")


class CsvOptions(BaseModel):
    companies: list[str]
    sites: list[str]


class CsvDownloadLink(BaseModel):
    download_link: str


@app.post("/api/v1/csv")
def read_root(csv_options: CsvOptions) -> CsvDownloadLink:
    download_link = get_names_and_positions_csv(csv_options.companies, csv_options.sites)
    return CsvDownloadLink(download_link=f"http://{settings.host}:{settings.port}/results/{download_link}")
