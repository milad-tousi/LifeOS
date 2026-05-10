import { LocationSuggestion, NominatimResult } from "@/features/events/types/location";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const MIN_QUERY_LEN = 3;
const RESULTS_LIMIT = 5;

/** Search for place suggestions via Nominatim */
export async function searchLocations(query: string): Promise<LocationSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LEN) return [];

  const url = `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(trimmed)}&limit=${RESULTS_LIMIT}&addressdetails=1`;

  const res = await fetch(url, {
    headers: { "Accept-Language": "en", "User-Agent": "LifeOS/1.0" },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);

  const data: NominatimResult[] = (await res.json()) as NominatimResult[];
  return data.map((item) => ({
    placeId: item.place_id,
    displayName: item.display_name,
    shortLabel: buildShortLabel(item),
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
  }));
}

/** Reverse geocode lat/lng to a human-readable address */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
  try {
    const res = await fetch(url, {
      headers: { "Accept-Language": "en", "User-Agent": "LifeOS/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? null;
  } catch {
    return null;
  }
}

/** Generate a Google Maps URL from coordinates or text */
export function buildGoogleMapsUrl(
  lat: number | null | undefined,
  lng: number | null | undefined,
  locationText: string | null | undefined,
): string {
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  if (locationText?.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText.trim())}`;
  }
  return "";
}

function buildShortLabel(item: NominatimResult): string {
  const addr = item.address;
  if (!addr) return item.display_name.split(",").slice(0, 2).join(",").trim();
  const city = addr.city ?? addr.town ?? addr.village ?? addr.state ?? "";
  const country = addr.country ?? "";
  const parts = item.display_name.split(",");
  const primary = parts[0].trim();
  const secondary = [city, country].filter(Boolean).join(", ");
  return secondary ? `${primary}, ${secondary}` : primary;
}
