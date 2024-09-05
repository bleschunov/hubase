interface IRow {
  name: string;
  position: string;
  searched_company: string;
  inferenced_company: string;
  original_url: string;
  source: string;
  download_link: string;
}

interface IRowWithId extends IRow {
  id: string;
}

interface CsvResponse {
  type: "log" | "csv_row";
  data: IRow | string;
}

type Strategy = "ner" | "gpt";

interface INERForm {
    strategy: "ner";
    companies: string;
    sites: string;
    positions: string;
    search_query_template: string;
    max_lead_count: number;
    companyPrompt: string;
    positionPrompt: string;
}

interface IGPTForm {
    strategy: "gpt";
    companies: string;
    sites: string;
    positions: string;
    search_query_template: string;
    max_lead_count: number;
    companyPrompt: string;
    positionPrompt: string;
    openai_api_key: string;
    openai_api_base: string;
}

export type {
  IRow, IRowWithId, CsvResponse, Strategy, INERForm, IGPTForm
}