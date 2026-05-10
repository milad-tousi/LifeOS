import { Component, ErrorInfo, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Component, ErrorInfo, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MapPin, ExternalLink, Loader, X, Navigation } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import type { LatLngExpression, LeafletMouseEvent } from "leaflet";
import "@/features/events/services/leafletIconFix";
import { useI18n } from "@/i18n";
import { EventLocation, LocationSuggestion } from "@/features/events/types/location";
import {
  searchLocations,
  reverseGeocode,
  buildGoogleMapsUrl,
} from "@/features/events/services/locationSearchService";

// ── Sub-components ────────────────────────────────────────────────────────────

/** Listens for map clicks to pick a location */
function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}): null {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Moves map view when center changes */
function MapViewUpdater({ center }: { center: LatLngExpression }): null {
  const map = useMap();
  useEffect(() => {
    try {
      map.setView(center, map.getZoom(), { animate: true });
    } catch {
      map.setView(DEFAULT_CENTER, map.getZoom(), { animate: false });
    }
  }, [map, center]);
  return null;
}

function MapSizeInvalidator({ active }: { active: boolean }): null {
  const map = useMap();

  useEffect(() => {
    if (!active) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      map.invalidateSize();
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [active, map]);

  return null;
}

class MapRenderBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {}

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface EventLocationPickerProps {
  value: EventLocation;
  onChange: (location: EventLocation) => void;
}

type SearchState = "idle" | "loading" | "done" | "error";

const DEFAULT_CENTER: LatLngExpression = [52.3508, 5.2647];
const DEBOUNCE_MS = 400;

// ── Component ─────────────────────────────────────────────────────────────────

export function EventLocationPicker({
  value,
  onChange,
}: EventLocationPickerProps): JSX.Element {
  const { t, direction } = useI18n();
  const isRtl = direction === "rtl";

  const [query, setQuery] = useState(value.locationText ?? "");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMap, setShowMap] = useState(
    !!(value.locationLat != null && value.locationLng != null),
  );
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [mapError, setMapError] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const didMountRef = useRef(false);
  const [suggestionsStyle, setSuggestionsStyle] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);

  // Sync query when value.locationText changes externally
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setQuery(value.locationText ?? "");
  }, [value.locationText]);

  useEffect(() => {
    if (showMap) {
      setMapError(false);
    }
  }, [showMap, value.locationLat, value.locationLng]);

  // Derived map center
  const hasValidCoordinates =
    Number.isFinite(value.locationLat) &&
    Number.isFinite(value.locationLng) &&
    Math.abs(value.locationLat ?? 0) <= 90 &&
    Math.abs(value.locationLng ?? 0) <= 180;

  const mapCenter: LatLngExpression = hasValidCoordinates
    ? [value.locationLat as number, value.locationLng as number]
    : DEFAULT_CENTER;

  const portalTarget = useMemo(
    () => (typeof document === "undefined" ? null : document.body),
    [],
  );

  // ── Autocomplete ────────────────────────────────────────────────────────────

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setSuggestions([]);
      setSearchState("idle");
      setShowSuggestions(false);
      return;
    }
    setSearchState("loading");
    setShowSuggestions(true);
    try {
      const results = await searchLocations(q);
      setSuggestions(results);
      setSearchState("done");
    } catch {
      setSuggestions([]);
      setSearchState("error");
    }
  }, []);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const q = e.target.value;
    setQuery(q);
    onChange({ ...value, locationText: q, locationProvider: "manual" });

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void runSearch(q), DEBOUNCE_MS);
  }

  function handleClearQuery(): void {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchState("idle");
    onChange({
      ...value,
      locationText: "",
      locationLat: null,
      locationLng: null,
      locationProvider: null,
    });
    inputRef.current?.focus();
  }

  function handleSuggestionSelect(s: LocationSuggestion): void {
    setQuery(s.displayName);
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchState("idle");
    setShowMap(true);
    onChange({
      ...value,
      locationText: s.displayName,
      locationLat: s.lat,
      locationLng: s.lng,
      locationProvider: "osm",
      locationUrl: null,
    });
  }

  useEffect(() => {
    if (!showSuggestions) {
      return;
    }

    function updateSuggestionsPosition(): void {
      const inputWrap = inputWrapRef.current;

      if (!inputWrap) {
        return;
      }

      const rect = inputWrap.getBoundingClientRect();
      setSuggestionsStyle({
        left: rect.left,
        top: rect.bottom + 4,
        width: rect.width,
      });
    }

    updateSuggestionsPosition();
    window.addEventListener("resize", updateSuggestionsPosition);
    window.addEventListener("scroll", updateSuggestionsPosition, true);

    return () => {
      window.removeEventListener("resize", updateSuggestionsPosition);
      window.removeEventListener("scroll", updateSuggestionsPosition, true);
    };
  }, [showSuggestions]);

  // ── Map click ───────────────────────────────────────────────────────────────

  async function handleMapPick(lat: number, lng: number): Promise<void> {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    setIsReverseGeocoding(true);
    onChange({ ...value, locationLat: lat, locationLng: lng, locationProvider: "osm" });
    try {
      const address = await reverseGeocode(lat, lng);
      const text = address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setQuery(text);
      onChange({
        ...value,
        locationLat: lat,
        locationLng: lng,
        locationText: text,
        locationProvider: "osm",
      });
    } catch {
      const text = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setQuery(text);
      onChange({ ...value, locationLat: lat, locationLng: lng, locationText: text });
    } finally {
      setIsReverseGeocoding(false);
    }
  }

  // ── Geolocation ─────────────────────────────────────────────────────────────

  function handleUseCurrentLocation(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setShowMap(true);
        void handleMapPick(latitude, longitude);
      },
      () => {
        /* permission denied — silently ignore */
      },
    );
  }

  // ── Google Maps ─────────────────────────────────────────────────────────────

  function handleOpenGoogleMaps(): void {
    const url = buildGoogleMapsUrl(value.locationLat, value.locationLng, value.locationText);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  const hasGoogleMapsTarget = !!(
    (value.locationLat != null && value.locationLng != null) ||
    value.locationText?.trim()
  );

  // ── Close suggestions on outside click ──────────────────────────────────────

  useEffect(() => {
    function handleOutside(e: MouseEvent): void {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={`ev-location${isRtl ? " ev-location--rtl" : ""}`}>
      {/* Label row */}
      <div className="ev-location__label-row">
        <MapPin size={13} className="ev-location__icon" />
        <span className="auth-form__label">{t("calendar.modal.location")}</span>
        <button
          className="ev-location__toggle-map"
          onClick={() => setShowMap((v) => !v)}
          title={showMap ? t("calendar.modal.location.hideMap") : t("calendar.modal.location.showMap")}
          type="button"
        >
          {showMap ? t("calendar.modal.location.hideMap") : t("calendar.modal.location.showMap")}
        </button>
      </div>

      {/* Input + autocomplete */}
      <div className="ev-location__input-wrap" ref={inputWrapRef}>
        <input
          ref={inputRef}
          autoComplete="off"
          className={`auth-form__input ev-location__input${isRtl ? " ev-location__input--rtl" : ""}`}
          onChange={handleQueryChange}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          placeholder={t("calendar.modal.placeholders.locationText")}
          value={query}
        />
        {/* Right-side icons */}
        <div className="ev-location__input-icons">
          {searchState === "loading" && (
            <Loader size={14} className="ev-location__spinner" />
          )}
          {isReverseGeocoding && (
            <Loader size={14} className="ev-location__spinner" />
          )}
          {query.trim() && searchState !== "loading" && !isReverseGeocoding && (
            <button
              className="ev-location__clear"
              onClick={handleClearQuery}
              tabIndex={-1}
              title="Clear"
              type="button"
            >
              <X size={13} />
            </button>
          )}
          {navigator.geolocation ? (
            <button
              className="ev-location__gps"
              onClick={handleUseCurrentLocation}
              title={t("calendar.modal.location.useMyLocation")}
              type="button"
            >
              <Navigation size={13} />
            </button>
          ) : null}
        </div>

        {/* Suggestions dropdown */}
      </div>

      {showSuggestions && portalTarget && suggestionsStyle
        ? createPortal(
            <div
              ref={suggestionsRef}
              className={`ev-location__suggestions${isRtl ? " ev-location__suggestions--rtl" : ""}`}
              role="listbox"
              style={{
                left: `${suggestionsStyle.left}px`,
                top: `${suggestionsStyle.top}px`,
                width: `${suggestionsStyle.width}px`,
              }}
            >
              {searchState === "loading" && (
                <div className="ev-location__sugg-status">{t("calendar.modal.location.searching")}</div>
              )}
              {searchState === "error" && (
                <div className="ev-location__sugg-status ev-location__sugg-status--error">
                  {t("calendar.modal.location.addressNotFound")}
                </div>
              )}
              {searchState === "done" && suggestions.length === 0 && (
                <div className="ev-location__sugg-status">{t("calendar.modal.location.noResults")}</div>
              )}
              {suggestions.map((s) => (
                <button
                  className="ev-location__sugg-item"
                  key={s.placeId}
                  onClick={() => handleSuggestionSelect(s)}
                  role="option"
                  type="button"
                >
                  <MapPin size={12} className="ev-location__sugg-icon" />
                  <span className="ev-location__sugg-text">{s.shortLabel}</span>
                </button>
              ))}
            </div>,
            portalTarget,
          )
        : null}

      {/* Embedded map */}
      {showMap && (
        <div className="ev-location__map-wrap">
          <MapRenderBoundary
            fallback={
              <div className="ev-location__map-error">
                {t("calendar.modal.location.mapLoadError")}
              </div>
            }
          >
            {mapError ? (
              <div className="ev-location__map-error">{t("calendar.modal.location.mapLoadError")}</div>
            ) : (
              <>
                <MapContainer
                  center={mapCenter}
                  className="ev-location__map"
                  scrollWheelZoom={false}
                  whenReady={() => setMapError(false)}
                  zoom={hasValidCoordinates ? 14 : 10}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    eventHandlers={{ tileerror: () => setMapError(true) }}
                  />
                  <MapViewUpdater center={mapCenter} />
                  <MapSizeInvalidator active={showMap} />
                  <MapClickHandler onPick={(lat, lng) => void handleMapPick(lat, lng)} />
                  {hasValidCoordinates && (
                    <Marker position={[value.locationLat as number, value.locationLng as number]} />
                  )}
                </MapContainer>
                <p className="ev-location__map-hint">{t("calendar.modal.location.clickHint")}</p>
              </>
            )}
          </MapRenderBoundary>
        </div>
      )}

      {/* Selected location summary + Google Maps button */}
      {(hasValidCoordinates || value.locationText?.trim()) && (
        <div className={`ev-location__summary${isRtl ? " ev-location__summary--rtl" : ""}`}>
          {hasValidCoordinates && (
            <span className="ev-location__coords">
              {(value.locationLat as number).toFixed(4)}, {(value.locationLng as number).toFixed(4)}
            </span>
          )}
          <button
            className={`ev-location__gmaps-btn${!hasGoogleMapsTarget ? " ev-location__gmaps-btn--disabled" : ""}`}
            disabled={!hasGoogleMapsTarget}
            onClick={handleOpenGoogleMaps}
            type="button"
          >
            <ExternalLink size={13} />
            <span>{t("calendar.modal.openInMaps")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
