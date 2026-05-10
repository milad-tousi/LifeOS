export type LocationProvider = "osm" | "google" | "manual";

export interface EventLocation {
  locationText?: string | null;
  locationUrl?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  locationProvider?: LocationProvider | null;
}

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    country?: string;
    state?: string;
  };
}

export interface LocationSuggestion {
  placeId: number;
  displayName: string;
  shortLabel: string;
  lat: number;
  lng: number;
}
