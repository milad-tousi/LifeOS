export type SearchSourceType = "web" | "youtube";

export interface SearchLinkRequest {
  query: string;
  type: SearchSourceType;
}

export interface SearchLinkResult {
  provider: string;
  query: string;
  type: SearchSourceType;
  url: string;
}
