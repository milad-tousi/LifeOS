import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { MapPin, ExternalLink, Loader, X, Navigation } from "lucide-react";
import L from "leaflet";

import "@/features/events/services/leafletIconFix";
import { useI18n } from "@/i18n";
import type { EventLocation, LocationSuggestion } from "@/features/events/types/location";
import {
  searchLocations,
  reverseGeocode,
  buildGoogleMapsUrl,
} from "@/features/events/services/locationSearchService";

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_LAT = 52.3508; // Almere, NL
const DEFAULT_LNG = 5.2647;
const DEBOUNCE_MS = 400;
const MAP_HEIGHT_DESKTOP = 260;
const MAP_HEIGHT_MOBILE = 220;

// ── LeafletMapWidget ─────────────────────────────────────────────────────────
// We drive Leaflet directly (no react-leaflet) to avoid the StrictMode bug in
// react-leaflet v5: MapContainer stores L.Map in useState; StrictMode calls
// cleanup (map.remove()) but preserves the stale state reference, so on the
// forced remount the guard fires and Leaflet is never re-initialised — but
// child hooks (useMap) receive the removed map and throw.
//
// By using a plain ref we reset it in cleanup, so the second StrictMode mount
// re-creates a clean Leaflet instance on the same (now empty) div.

interface LeafletMapWidgetProps {
  centerLat: number;
  centerLng: number;
  zoom: number;
  height: number;
  markerLat: number | null;
  markerLng: number | null;
  onPick: (lat: number, lng: number) => void;
  onTileError: () => void;
}

function LeafletMapWidget({
  centerLat,
  centerLng,
  zoom,
  height,
  markerLat,
  markerLng,
  onPick,
  onTileError,
}: LeafletMapWidgetProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Keep callback refs up-to-date without restarting the map effect
  const onPickRef = useRef(onPick);
  const onTileErrorRef = useRef(onTileError);
  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);
  useEffect(() => {
    onTileErrorRef.current = onTileError;
  }, [onTileError]);

  // ── Init map once on mount ────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Guard: if a map is already attached to this container (e.g. hot-reload),
    // skip double-init. StrictMode resets mapRef in cleanup, so this guard
    // is only hit in non-StrictMode cases.
    if (mapRef.current) return;

    let map: L.Map;
    try {
      map = L.map(container, {
        center: [centerLat, centerLng],
        zoom,
        scrollWheelZoom: false,
        zoomControl: true,
      });
    } catch {
      return; // Container already used by Leaflet (rare edge case)
    }

    const tiles = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      },
    );
    tiles.on("tileerror", () => onTileErrorRef.current());
    tiles.addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      onPickRef.current(e.latlng.lat, e.latlng.lng);
    });

    if (markerLat !== null && markerLng !== null) {
      markerRef.current = L.marker([markerLat, markerLng]).addTo(map);
    }

    mapRef.current = map;

    // Invalidate size after the modal has finished its CSS transition
    window.setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {
        /* ignore */
      }
    }, 250);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fly to updated center ─────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      const z = map.getZoom() ?? zoom;
      map.setView([centerLat, centerLng], z < 10 ? 14 : z, { animate: true });
    } catch {
      /* map may be mid-teardown */
    }
  }, [centerLat, centerLng, zoom]);

  // ── Sync marker position ──────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const hasCoords = markerLat !== null && markerLng !== null;
    if (hasCoords) {
      const ll: L.LatLngTuple = [markerLat as number, markerLng as number];
      if (markerRef.current) {
        markerRef.current.setLatLng(ll);
      } else {
        markerRef.current = L.marker(ll).addTo(map);
      }
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [markerLat, markerLng]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: "100%", display: "block" }}
    />
  );
}

// ── Error boundary ────────────────────────────────────────────────────────────

class MapErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { crashed: boolean }
> {
  state = { crashed: false };

  static getDerivedStateFromError(): { crashed: boolean } {
    return { crashed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Silently swallow — fallback UI is shown below
  }

  render(): ReactNode {
    return this.state.crashed ? this.props.fallback : this.props.children;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface EventLocationPickerProps {
  value: EventLocation;
  onChange: (location: EventLocation) => void;
}

type SearchState = "idle" | "loading" | "done" | "error";

// ── Coordinate helper ─────────────────────────────────────────────────────────

function isValidCoord(lat: unknown, lng: unknown): lat is number {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EventLocationPicker({ value, onChange }: EventLocationPickerProps): JSX.Element {
  const { t, direction } = useI18n();
  const isRtl = direction === "rtl";

  const [query, setQuery] = useState(value.locationText ?? "");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMap, setShowMap] = useState(
    isValidCoord(value.locationLat, value.locationLng),
  );
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [mapError, setMapError] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [suggestionsPos, setSuggestionsPos] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);

  const portalTarget = useMemo(
    () => (typeof document === "undefined" ? null : document.body),
    [],
  );

  // Sync query when parent resets the value
  const prevLocationText = useRef(value.locationText);
  useEffect(() => {
    if (value.locationText !== prevLocationText.current) {
      setQuery(value.locationText ?? "");
      prevLocationText.current = value.locationText;
    }
  }, [value.locationText]);

  function openMap(): void {
    setMapError(false);
    setShowMap(true);
  }

  function toggleMap(): void {
    if (showMap) {
      setShowMap(false);
    } else {
      openMap();
    }
  }

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, []);

  // ── Autocomplete ────────────────────────────────────────────────────────────

  const runSearch = useCallback(async (q: string) => {
    const clean = q.trim();
    if (clean.length < 3) {
      setSuggestions([]);
      setSearchState("idle");
      setShowSuggestions(false);
      return;
    }
    setSearchState("loading");
    setShowSuggestions(true);
    try {
      const results = await searchLocations(clean);
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
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => void runSearch(q), DEBOUNCE_MS);
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
      locationUrl: null,
      locationProvider: null,
    });
    inputRef.current?.focus();
  }

  function handleSuggestionSelect(s: LocationSuggestion): void {
    setQuery(s.displayName);
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchState("idle");
    onChange({
      ...value,
      locationText: s.displayName,
      locationLat: s.lat,
      locationLng: s.lng,
      locationProvider: "osm",
      locationUrl: null,
    });
    openMap();
  }

  // Position suggestions dropdown via portal
  useEffect(() => {
    if (!showSuggestions) return;

    function update(): void {
      const rect = inputWrapRef.current?.getBoundingClientRect();
      if (!rect) return;
      setSuggestionsPos({ left: rect.left, top: rect.bottom + 6, width: rect.width });
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [showSuggestions]);

  // Close suggestions on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent): void {
      const target = e.target as Node;
      if (
        suggestionsRef.current?.contains(target) ||
        inputRef.current?.contains(target)
      )
        return;
      setShowSuggestions(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // ── Map interactions ────────────────────────────────────────────────────────

  async function handleMapPick(lat: number, lng: number): Promise<void> {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
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
        locationUrl: null,
      });
    } catch {
      const text = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setQuery(text);
      onChange({ ...value, locationLat: lat, locationLng: lng, locationText: text, locationProvider: "osm" });
    } finally {
      setIsReverseGeocoding(false);
    }
  }

  function handleUseCurrentLocation(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        openMap();
        void handleMapPick(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        /* denied — silent */
      },
    );
  }

  function handleOpenGoogleMaps(): void {
    const url = buildGoogleMapsUrl(value.locationLat, value.locationLng, value.locationText);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const validCoords = isValidCoord(value.locationLat, value.locationLng);
  const centerLat = validCoords ? (value.locationLat as number) : DEFAULT_LAT;
  const centerLng = validCoords ? (value.locationLng as number) : DEFAULT_LNG;

  const hasTarget = Boolean(validCoords || value.locationText?.trim());

  const mapHeight =
    typeof window !== "undefined" && window.innerWidth <= 640
      ? MAP_HEIGHT_MOBILE
      : MAP_HEIGHT_DESKTOP;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={`ev-location${isRtl ? " ev-location--rtl" : ""}`}>

      {/* Label row */}
      <div className="ev-location__label-row">
        <div className="ev-location__label-main">
          <MapPin size={13} className="ev-location__icon" />
          <span className="auth-form__label">{t("calendar.modal.location")}</span>
        </div>
        <button
          className="ev-location__toggle-map"
          onClick={toggleMap}
          type="button"
        >
          {showMap ? t("calendar.modal.location.hideMap") : t("calendar.modal.location.showMap")}
        </button>
      </div>

      {/* Input */}
      <div className="ev-location__input-wrap" ref={inputWrapRef}>
        <input
          ref={inputRef}
          autoComplete="off"
          className={`auth-form__input ev-location__input${isRtl ? " ev-location__input--rtl" : ""}`}
          onChange={handleQueryChange}
          onFocus={() => {
            if (suggestions.length > 0 || searchState === "loading") setShowSuggestions(true);
          }}
          placeholder={t("calendar.modal.placeholders.locationText")}
          value={query}
        />
        <div className="ev-location__input-icons">
          {(searchState === "loading" || isReverseGeocoding) && (
            <Loader size={14} className="ev-location__spinner" />
          )}
          {query.trim() && searchState !== "loading" && !isReverseGeocoding && (
            <button
              className="ev-location__clear"
              onClick={handleClearQuery}
              tabIndex={-1}
              type="button"
              title="Clear"
            >
              <X size={13} />
            </button>
          )}
          {typeof navigator !== "undefined" && navigator.geolocation ? (
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
      </div>

      {/* Suggestions portal */}
      {showSuggestions && portalTarget && suggestionsPos
        ? createPortal(
            <div
              ref={suggestionsRef}
              className={`ev-location__suggestions${isRtl ? " ev-location__suggestions--rtl" : ""}`}
              role="listbox"
              style={{
                position: "fixed",
                left: suggestionsPos.left,
                top: suggestionsPos.top,
                width: suggestionsPos.width,
                zIndex: 2200,
              }}
            >
              {searchState === "loading" && (
                <div className="ev-location__sugg-status">
                  {t("calendar.modal.location.searching")}
                </div>
              )}
              {searchState === "error" && (
                <div className="ev-location__sugg-status ev-location__sugg-status--error">
                  {t("calendar.modal.location.addressNotFound")}
                </div>
              )}
              {searchState === "done" && suggestions.length === 0 && (
                <div className="ev-location__sugg-status">
                  {t("calendar.modal.location.noResults")}
                </div>
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
                  <span className="ev-location__sugg-text">{s.shortLabel || s.displayName}</span>
                </button>
              ))}
            </div>,
            portalTarget,
          )
        : null}

      {/* Embedded map */}
      {showMap && (
        <div
          className="ev-location__map-wrap"
          style={{ height: mapHeight + 2 /* account for border */ }}
        >
          <MapErrorBoundary
            fallback={
              <div className="ev-location__map-error">
                {t("calendar.modal.location.mapLoadError")}
              </div>
            }
          >
            {mapError ? (
              <div className="ev-location__map-error">
                {t("calendar.modal.location.mapLoadError")}
              </div>
            ) : (
              <>
                <LeafletMapWidget
                  centerLat={centerLat}
                  centerLng={centerLng}
                  zoom={validCoords ? 14 : 10}
                  height={mapHeight}
                  markerLat={validCoords ? (value.locationLat as number) : null}
                  markerLng={validCoords ? (value.locationLng as number) : null}
                  onPick={(lat, lng) => void handleMapPick(lat, lng)}
                  onTileError={() => setMapError(true)}
                />
                <p className="ev-location__map-hint">
                  {t("calendar.modal.location.clickHint")}
                </p>
              </>
            )}
          </MapErrorBoundary>
        </div>
      )}

      {/* Selected location summary */}
      {hasTarget && (
        <div className={`ev-location__summary${isRtl ? " ev-location__summary--rtl" : ""}`}>
          {validCoords && (
            <span className="ev-location__coords">
              {(value.locationLat as number).toFixed(4)},{" "}
              {(value.locationLng as number).toFixed(4)}
            </span>
          )}
          <button
            className={`ev-location__gmaps-btn${!hasTarget ? " ev-location__gmaps-btn--disabled" : ""}`}
            disabled={!hasTarget}
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
