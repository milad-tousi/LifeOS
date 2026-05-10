import { buildWebSearchLink } from "@/features/search/providers/webSearch";
import { buildYoutubeSearchLink } from "@/features/search/providers/youtubeSearch";
import { SearchLinkRequest, SearchLinkResult } from "@/features/search/types";

export function buildSearchLink(request: SearchLinkRequest): SearchLinkResult | null {
  switch (request.type) {
    case "youtube":
      return buildYoutubeSearchLink(request.query);
    case "web":
    default:
      return buildWebSearchLink(request.query);
  }
}
