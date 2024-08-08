interface IRow {
  name: string;
  position: string;
  searched_company: string;
  inferenced_company: string;
  original_url: string;
  short_original_url: string;
  source: string;
  download_link: string;
}

interface CsvResponse {
  type: "log" | "csv_row";
  data: IRow | string;
}


export type {
  IRow, CsvResponse
}