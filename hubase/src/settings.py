from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='../.env', env_file_encoding='utf-8')
    hugging_face_token: str
    mistral_api_key: str
    host: str
    port: int


settings = Settings()
