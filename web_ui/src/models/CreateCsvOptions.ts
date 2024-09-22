interface CreateCsvOptions {
  companies: string[];
  sites: string[];
  positions: string[];
  search_query_template: string;
  access_token: string;
  company_prompt: string;
  position_prompt: string;
  max_lead_count: number;
  max_sites_count: number,
  openai_api_key: string;
  openai_api_base: string;
  mode: string;
}

export type {
  CreateCsvOptions,
}
