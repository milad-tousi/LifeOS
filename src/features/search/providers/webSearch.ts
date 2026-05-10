import { SearchLinkResult } from "@/features/search/types";

export function buildWebSearchLink(query: string): SearchLinkResult | null {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return null;
  }

  const params = new URLSearchParams({
    q: normalizedQuery,
  });

  return {
    provider: "google-search-url",
    query: normalizedQuery,
    type: "web",
    url: `https://www.google.com/search?${params.toString()}`,
  };
}
