import json
import typing as t

from asyncer import asyncify
from fastapi import FastAPI, HTTPException
from mistralai.exceptions import MistralAPIException
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from starlette.websockets import WebSocket

from exceptions import HuggingFaceException
from helper import short
from main import get_names_and_positions_csv, get_names_and_positions_csv_with_progress
from settings import settings

app = FastAPI()

origins = [
    settings.cors_origins,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CsvOptions(BaseModel):
    companies: list[str]
    sites: list[str]
    positions: list[str]


class CsvDownloadLink(BaseModel):
    download_link: str


class CsvRow(CsvDownloadLink):
    name: str
    position: str
    searched_company: str
    inferenced_company: str
    original_url: str
    short_original_url: str
    source: str


@app.websocket("/api/v1/csv/progress")
async def get_csv_with_progress(ws: WebSocket) -> None:
    def next_(gen: t.Iterator[any]) -> any:
        try:
            return next(gen)
        except StopIteration:
            return None

    await ws.accept()

    csv_options = CsvOptions.parse_obj(await ws.receive_json())
    rows = await asyncify(get_names_and_positions_csv_with_progress)(
        companies=csv_options.companies,
        sites=csv_options.sites,
        positions=csv_options.positions
    )

    try:
        download_link = await asyncify(next_)(rows)
        while True:
            row = await asyncify(next_)(rows)

            if row is None:
                break

            row_dto = CsvRow(
                name=short(row["name"]),
                position=short(row["position"]),
                searched_company=short(row["searched_company"]),
                inferenced_company=short(row["inferenced_company"]),
                original_url=row["original_url"],
                short_original_url=short(row["original_url"]),
                source=short(row["source"]),
                download_link=download_link
            )

            await ws.send_json(row_dto.model_dump())

        await ws.close()
    except HuggingFaceException as err:
        raise HTTPException(status_code=403, detail=str(err))
    except MistralAPIException as err:
        # 'Status: 403. Message: {"message":"Inactive subscription or usage limit reached"}'
        msg = json.loads("{" + err.message.split("{")[-1])
        raise HTTPException(status_code=403, detail=f"Ошибка MistralAPI: {msg['message']}")


@app.post("/api/v1/csv")
def get_csv(csv_options: CsvOptions) -> CsvDownloadLink:
    try:
        download_link = get_names_and_positions_csv(csv_options.companies, csv_options.sites, csv_options.positions)
    except HuggingFaceException as err:
        raise HTTPException(status_code=403, detail=str(err))
    except MistralAPIException as err:
        # 'Status: 403. Message: {"message":"Inactive subscription or usage limit reached"}'
        msg = json.loads("{" + err.message.split("{")[-1])
        raise HTTPException(status_code=403, detail=f"Ошибка MistralAPI: {msg['message']}")
    return CsvDownloadLink(download_link=f"http://{settings.download_host}:{settings.port}/static/results/{download_link}")


app.mount("/static/results", StaticFiles(directory="../results"), name="results")
app.mount("/static", StaticFiles(directory="../front", html=True), name="front")
