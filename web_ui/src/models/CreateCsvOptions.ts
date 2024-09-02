interface CreateCsvOptions {
  companies: string[];
  sites: string[];
  positions: string[];
  search_query_template: string;
  access_token: string;
  company_prompt: string;
  position_prompt: string;
  max_lead_count: number;
}

export type {
  CreateCsvOptions,
}
