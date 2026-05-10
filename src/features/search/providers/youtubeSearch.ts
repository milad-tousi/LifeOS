import { SearchLinkResult } from "@/features/search/types";

export function buildYoutubeSearchLink(query: string): SearchLinkResult | null {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return null;
  }

  const params = new URLSearchParams({
    search_query: normalizedQuery,
  });

  return {
    provider: "youtube-search-url",
    query: normalizedQuery,
    type: "youtube",
    url: `https://www.youtube.com/results?${params.toString()}`,
  };
}
