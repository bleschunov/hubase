interface CreateCsvOptions {
  companies: string[];
  sites: string[];
}

interface CreateCsvResponseData {
  download_link: string
}

export type {
  CreateCsvOptions,
  CreateCsvResponseData
}
