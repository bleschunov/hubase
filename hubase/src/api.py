import asyncio
import json
import logging
import typing as t
from pathlib import Path

from asyncer import asyncify
from fastapi import FastAPI, HTTPException
from mistralai.exceptions import MistralAPIException
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from starlette.websockets import WebSocket

from exceptions import HuggingFaceException
from helper import short
from hubase.tests.mocks.mock_word_classifications import MockWordClassifications
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


@app.websocket("/api/v1/csv/progress")
async def get_csv_with_progress(ws: WebSocket) -> None:
    def next_(gen: t.Iterator[any]) -> any:
        try:
            return next(gen)
        except StopIteration:
            return None

    await ws.accept()

    csv_options = CsvOptions.parse_obj(await ws.receive_json())

    if csv_options.access_token != settings.access_token:
        logging.info("Доступ запрещён.")
        await ws.close()

    logging.info("Доступ разрешён.")

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
    if csv_options.access_token != settings.access_token:
        logging.info("Доступ запрещён.")
        raise HTTPException(status_code=404)

    logging.info("Доступ разрешён.")

    try:
        download_link = get_names_and_positions_csv(csv_options.companies, csv_options.sites, csv_options.positions)
    except HuggingFaceException as err:
        raise HTTPException(status_code=403, detail=str(err))
    except MistralAPIException as err:
        # 'Status: 403. Message: {"message":"Inactive subscription or usage limit reached"}'
        msg = json.loads("{" + err.message.split("{")[-1])
        raise HTTPException(status_code=403, detail=f"Ошибка MistralAPI: {msg['message']}")
    return CsvDownloadLink(download_link=f"http://{settings.download_host}:{settings.port}/static/results/{download_link}")

class WebSocketHandler(logging.Handler):
    def __init__(self, ws: WebSocket):
        super().__init__()
        self.ws = ws
        self.loop = None
        self.thread = threading.Thread(target=self._start_loop)
        self.thread.start()

    def _start_loop(self):
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        self.loop.run_forever()

    def emit(self, record):
        if self.loop:
            log_entry = self.format(record)
            self.loop.call_soon_threadsafe(asyncio.create_task, self.send_log(log_entry))
        else:
            logging.error("Ошибка выведения логов.")

    async def send_log(self, message: str):
        try:
            await self.ws.send_text(message)
        except Exception as e:
            logging.error(f"Не удалось отправить лог: {e}")

    def close(self):
        if self.loop:
            self.loop.call_soon_threadsafe(self.loop.stop)
            self.thread.join()
        super().close()


@app.websocket("/api/v1/ws/logs")
async def websocket_logs(ws: WebSocket):
    await ws.accept()
    handler = WebSocketHandler(ws)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)

    logging.getLogger().setLevel(logging.INFO)
    logging.getLogger().addHandler(handler)

    try:
        i = 1
        while True:
            # Держим соединение открытым
            await ws.send_text("ping")
            i += 1
            await asyncio.sleep(10)  # Отправляем ping каждые 10 секунд
    except Exception as e:
        logging.exception("Соединение с WebSocket закрыто")
    finally:
        print("remove")
        logging.getLogger().removeHandler(handler)


@app.websocket("/api/v1/csv/progress")
async def get_csv_with_progress(ws: WebSocket) -> None:
    await ws.accept()

    csv_options = CsvOptions.parse_obj(await ws.receive_json())

    if csv_options.access_token != settings.access_token:
        logging.info("Доступ запрещён.")
        await ws.close()

    logging.info("Доступ разрешён.")

    mock_data_instance = MockWordClassifications()
    rows = mock_data_instance.get_mock_data()

    try:
        download_link = "mock_download_link"
        for row in rows:
            row_dto = CsvRow(
                name=short(row["name"]),
                position=short(row["position"]),
                searched_company=short(row["searched_company"]),
                inferenced_company=short(row["inferenced_company"]),
                original_url=row["original_url"],
                short_original_url=short(row["original_url"]),
                source=row["source"],
                download_link=download_link
            )

            await ws.send_json(row_dto.model_dump())

        await ws.close()
    except Exception as err:
        logging.warning(f"Ошибка при отправке mock-данных: {err}")

@app.post("/api/v1/csv")
def get_csv(csv_options: CsvOptions) -> CsvDownloadLink:
    if csv_options.access_token != settings.access_token:
        logging.info("Доступ запрещён.")
        raise HTTPException(status_code=404)

    logging.info("Доступ разрешён.")

    try:
        mock_data_instance = MockWordClassifications()
        mock_data_instance.get_mock_data()
        download_link = "mock_download_link"
    except Exception as err:
        raise HTTPException(status_code=500, detail=str(err))


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

    return CsvDownloadLink(
        download_link=f"http://{settings.download_host}:{settings.port}/static/results/{download_link}")

app.mount("/static/results", StaticFiles(directory="../results"), name="results")
app.mount("/static", StaticFiles(directory="../front", html=True), name="front")
