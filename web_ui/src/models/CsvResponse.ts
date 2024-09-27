interface IRow {
  name: string;
  position: string;
  searched_company: string;
  inferenced_company: string;
  original_url: string;
  source: string;
  download_link: string;
  site: string;
}

interface IRowWithId extends IRow {
  id: string;
}

interface CsvResponse {
  type: "log" | "csv_row";
  data: IRow | string;
}


export type {
  IRow, IRowWithId, CsvResponse
}