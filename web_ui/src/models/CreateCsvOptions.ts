interface CreateCsvOptions {
  companies: string[];
  sites: string[];
  positions: string[];
  search_query_template: string;
  access_token: string;
  company_prompt: string;
  position_prompt: string;
  max_lead_count: number;
  openai_api_key: string;
  openai_api_base: string;
  exclude_vacations: boolean;
  exclude_profiles: boolean;
}

export type {
  CreateCsvOptions,
}
