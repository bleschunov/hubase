interface CreateCsvOptions {
  companies: string[];
  sites: string[];
  positions: string[];
}

interface CreateCsvResponseData {
  download_link: string
}

export type {
  CreateCsvOptions,
  CreateCsvResponseData
}
