import asyncio
import json
import logging
import typing as t
from queue import Queue
from pathlib import Path

from asyncer import asyncify
from fastapi import FastAPI, HTTPException, WebSocket
from mistralai.exceptions import MistralAPIException
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from starlette.websockets import WebSocketDisconnect

from exceptions import HuggingFaceException
from main import get_names_and_positions_csv, get_names_and_positions_csv_with_progress
from prompt.fs_prompt import FileSystemPrompt
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
    access_token: str


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


class Prompt(BaseModel):
    prompt_text: str


class UpdatePrompt(BaseModel):
    name: str
    prompt_text: str


log_queues: t.Dict[WebSocket, Queue] = {}

class WebSocketHandler(logging.Handler):
    def __init__(self, ws: WebSocket):
        super().__init__()
        self.ws = ws

    def emit(self, record):
        try:
            log_entry = self.format(record)
            log_queues[self.ws].put_nowait(log_entry)
        except TypeError as e:
            logging.error(f"{record.msg}", exc_info=True)
            raise e


@app.websocket("/api/v1/csv/progress")
async def get_csv_with_progress(ws: WebSocket) -> None:
    await ws.accept()

    csv_options = CsvOptions.parse_obj(await ws.receive_json())

    if csv_options.access_token != settings.access_token:
        logging.info("Доступ запрещён.")
        await ws.close()
        return

    logging.info("Доступ разрешён.")

    log_queue = Queue()
    log_queues[ws] = log_queue

    handler = WebSocketHandler(ws)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)

    logger = logging.getLogger(f"websocket_{id(ws)}")
    logger.setLevel(logging.INFO)
    logger.addHandler(handler)

    async def send_logs():
        while True:
            message = await asyncio.to_thread(log_queue.get)
            await ws.send_text(message)

    send_logs_task = asyncio.create_task(send_logs())

    try:
        rows = await asyncify(get_names_and_positions_csv_with_progress)(
            companies=csv_options.companies,
            sites=csv_options.sites,
            positions=csv_options.positions,
            logger=logger
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
                short_original_url=row["original_url"],
                source=row["source"],
                download_link=download_link
            )

            await ws.send_json(row_dto.model_dump())

        await ws.close()
    except WebSocketDisconnect:
        pass
    except HuggingFaceException as err:
        raise HTTPException(status_code=403, detail=str(err))
    except MistralAPIException as err:
        msg = json.loads("{" + err.message.split("{")[-1])
        raise HTTPException(status_code=403, detail=f"Ошибка MistralAPI: {msg['message']}")
    finally:
        send_logs_task.cancel()
        logger.removeHandler(handler)
        logging.getLogger().removeHandler(handler)
        del log_queues[ws]


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


app.mount("/static/results", StaticFiles(directory="../results"), name="results")
app.mount("/static", StaticFiles(directory="../front", html=True), name="front")