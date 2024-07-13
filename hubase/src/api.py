import json

from fastapi import FastAPI, HTTPException
from mistralai.exceptions import MistralAPIException
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles

from main import get_names_and_positions_csv, HuggingFaceException
from settings import settings

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://13.233.53.215:80",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount("/results", StaticFiles(directory="../results"), name="results")
app.mount("/", StaticFiles(directory="../front", html=True), name="front")


class CsvOptions(BaseModel):
    companies: list[str]
    sites: list[str]


class CsvDownloadLink(BaseModel):
    download_link: str


@app.post("/api/v1/csv")
def read_root(csv_options: CsvOptions) -> CsvDownloadLink:
    try:
        download_link = get_names_and_positions_csv(csv_options.companies, csv_options.sites)
    except HuggingFaceException as err:
        raise HTTPException(status_code=403, detail=str(err))
    except MistralAPIException as err:
        # 'Status: 403. Message: {"message":"Inactive subscription or usage limit reached"}'
        msg = json.loads("{" + err.message.split("{")[-1])
        raise HTTPException(status_code=403, detail=f"Ошибка MistralAPI: {msg['message']}")
    return CsvDownloadLink(download_link=f"http://{settings.download_host}:{settings.port}/results/{download_link}")
