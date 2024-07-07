import uvicorn

from hubase.src.api import app
from hubase.src.settings import settings

uvicorn.run(app, host=settings.host, port=settings.port)
