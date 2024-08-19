import asyncio
import json
import logging
import typing as t
from pathlib import Path

from asyncer import asyncify
from fastapi import FastAPI, HTTPException, WebSocket, Body
from mistralai.exceptions import MistralAPIException
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from starlette.websockets import WebSocketDisconnect

from api.model import CsvResponse, CsvOptions, CsvRow, CsvDownloadLink, Prompt, UpdatePrompt
from exceptions import HuggingFaceException
from main import get_names_and_positions_csv, get_names_and_positions_csv_with_progress
from prompt.fs_prompt import FileSystemPrompt
from search_queries import SearchQueries
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


class WebSocketLoggingHandler(logging.Handler):
    def __init__(self, websocket: WebSocket):
        super().__init__()
        self.websocket = websocket

    def emit(self, record: logging.LogRecord):
        log_entry = self.format(record)
        asyncio.run(self.__send_log(log_entry))

    async def __send_log(self, log_entry: str):
        await self.websocket.send_json(CsvResponse(type="log", data=log_entry).model_dump())


class SearchQueryResponse(BaseModel):
    type: t.Literal["error", "success"]
    data: str | list[str]


@app.websocket("/api/v1/csv/progress")
async def get_csv_with_progress(ws: WebSocket) -> None:
    await ws.accept()

    csv_options = CsvOptions.parse_obj(await ws.receive_json())

    if csv_options.access_token != settings.access_token:
        logging.info("Доступ запрещён.")
        await ws.close()
        return

    logging.info("Доступ разрешён.")

    logging_handler = WebSocketLoggingHandler(ws)
    formatter = logging.Formatter('%(asctime)s | %(message)s', "%H:%M:%S")
    logging_handler.setFormatter(formatter)

    logger = logging.getLogger(f"ws_{hex(id(ws))}")
    logger.setLevel(logging.INFO)
    logger.addHandler(logging_handler)

    try:
        rows = await asyncify(get_names_and_positions_csv_with_progress)(
            csv_options=csv_options,
            logger=logger,
        )

        def next_(gen: t.Iterator[any]) -> any:
            try:
                return next(gen)
            except StopIteration:
                return None

        download_link = await asyncify(next_)(rows)
        while True:
            row = await asyncify(next_)(rows)

            if row is None:
                break

            row_dto = CsvRow(
                name=row["name"],
                position=row["position"],
                searched_company=row["searched_company"],
                inferenced_company=row["inferenced_company"],
                original_url=row["original_url"],
                source=row["source"],
                download_link=download_link
            )

            csv_response = CsvResponse(type="csv_row", data=row_dto)
            await ws.send_json(csv_response.model_dump())

        await ws.close()
    except WebSocketDisconnect:
        pass
    except HuggingFaceException as err:
        raise HTTPException(status_code=403, detail=str(err))
    except MistralAPIException as err:
        msg = json.loads("{" + err.message.split("{")[-1])
        raise HTTPException(status_code=403, detail=f"Ошибка MistralAPI: {msg['message']}")


@app.post("/api/v1/csv")
def get_csv(csv_options: CsvOptions) -> CsvDownloadLink:
    if csv_options.access_token != settings.access_token:
        logging.info("Доступ запрещён.")
        raise HTTPException(status_code=404)

    logging.info("Доступ разрешён.")

    try:
        download_link = get_names_and_positions_csv(csv_options.companies, csv_options.sites, csv_options.positions)
    except HuggingFaceException as err:
        raise HTTPException(status_code=403, detail=str(err))
    except MistralAPIException as err:
        msg = json.loads("{" + err.message.split("{")[-1])
        raise HTTPException(status_code=403, detail=f"Ошибка MistralAPI: {msg['message']}")
    return CsvDownloadLink(download_link=f"http://{settings.download_host}:{settings.port}/static/results/{download_link}")


@app.get("/api/v1/prompt/{name}")
def get_prompt(name: str) -> Prompt:
    prompt = FileSystemPrompt(Path(f"../prompts/{name}.txt")).get()
    return Prompt(prompt_text=prompt)


@app.patch("/api/v1/prompt")
def update_prompt(update_prompt: UpdatePrompt) -> Prompt:
    new_prompt = FileSystemPrompt(Path(f"../prompts/{update_prompt.name}.txt")).update(update_prompt.prompt_text)
    return Prompt(prompt_text=new_prompt)


@app.patch("/api/v1/prompt/{name}/reset")
def reset_prompt(name: str) -> Prompt:
    default_prompt = FileSystemPrompt(Path(f"../prompts/{name}_default.txt"))
    reset_prompt_ = FileSystemPrompt(Path(f"../prompts/{name}.txt")).update(default_prompt.get())
    return Prompt(prompt_text=reset_prompt_)


@app.post("/api/v1/search_query")
def compile_search_queries(search_query_template: t.Annotated[str, Body()]) -> SearchQueryResponse:
    example_companies = ["WeDo", "Hub"]
    example_positions = ["директор дискотеки", "менеджер танцев"]
    example_sites = ["roga.com", "kopyta.com"]
    try:
        queries = SearchQueries(search_query_template, example_companies, example_positions, example_sites)
    except ValueError as err:
        return SearchQueryResponse(type="error", data=str(err))
    else:
        compiled = [q.query for q in queries.compiled()]
        return SearchQueryResponse(type="success", data=compiled)



app.mount("/static/results", StaticFiles(directory="../results"), name="results")
app.mount("/static", StaticFiles(directory="../front", html=True), name="front")