from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='../.env', env_file_encoding='utf-8')
    hugging_face_token: str
    hugging_face_ner_api_url: str
    mistral_api_key: str
    download_host: str = Field("localhost")
    host: str = Field("localhost")
    port: int = Field(8080)
    cors_origins: str = Field("http://localhost:5173")
    access_token: str
    openai_api_key: str


settings = Settings()
