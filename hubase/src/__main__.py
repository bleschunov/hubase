import uvicorn

from api import app
from settings import settings

uvicorn.run(app, host=settings.host, port=settings.port)
