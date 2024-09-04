type Strategy = "ner" | "gpt"

interface SeachEngineParams {
  search_query_template: string;
}

interface SecurityParams {
  access_token: string;
}

interface LeadParams {
  companies: string[];
  sites: string[];
  positions: string[];
  max_lead_count: number;
}

interface NEROptions extends LeadParams, SeachEngineParams, SecurityParams {
  company_prompt: string;
  position_prompt: string;
}

interface GPTOptions extends LeadParams, SeachEngineParams, SecurityParams {
  prompt: string;
  openai_api_key: string;
  openai_api_base: string;
}

interface CreateCSVRequest {
  strategy: Strategy
  params: GPTOptions | NEROptions
}

export type {
  CreateCSVRequest,
  Strategy,
}
