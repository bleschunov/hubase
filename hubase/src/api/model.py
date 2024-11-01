import typing as t

from pydantic import BaseModel, SecretStr


class CsvOptions(BaseModel):
    companies: list[str]
    sites: list[str]
    positions: list[str]
    search_query_template: str
    access_token: SecretStr
    company_prompt: str
    position_prompt: str
    max_lead_count: int
    openai_api_key: SecretStr
    openai_api_base: str
    excluded_sites_lists: list[str]


class CsvDownloadLink(BaseModel):
    download_link: str


class CsvRow(CsvDownloadLink):
    name: str
    position: str
    searched_company: str
    inferenced_company: str
    original_url: str
    source: str


class Prompt(BaseModel):
    prompt_text: str


class UpdatePrompt(BaseModel):
    name: str
    prompt_text: str


class CsvResponse(BaseModel):
    type: t.Literal["log", "csv_row"]
    data: CsvRow | str