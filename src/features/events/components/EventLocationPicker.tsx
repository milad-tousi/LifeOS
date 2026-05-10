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
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import type { LatLngExpression, LeafletMouseEvent } from "leaflet";

import "@/features/events/services/leafletIconFix";
import { useI18n } from "@/i18n";
import type { EventLocation, LocationSuggestion } from "@/features/events/types/location";

import {
  searchLocations,
  reverseGeocode,
  buildGoogleMapsUrl,
} from "@/features/events/services/locationSearchService";

const DEFAULT_CENTER: LatLngExpression = [52.3508, 5.2647]; // Almere, Netherlands
const DEBOUNCE_MS = 400;

interface EventLocationPickerProps {
  value: EventLocation;
  onChange: (location: EventLocation) => void;
}

type SearchState = "idle" | "loading" | "done" | "error";

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
    if (!active) return;

    const timeoutId = window.setTimeout(() => {
      map.invalidateSize();
    }, 150);

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
    Boolean(value.locationLat != null && value.locationLng != null),
  );
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [mapError, setMapError] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputWrapRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [suggestionsStyle, setSuggestionsStyle] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);

  const portalTarget = useMemo(() => {
    if (typeof document === "undefined") return null;
    return document.body;
  }, []);

  useEffect(() => {
    setQuery(value.locationText ?? "");
  }, [value.locationText]);

  useEffect(() => {
    if (showMap) {
      setMapError(false);
    }
  }, [showMap, value.locationLat, value.locationLng]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const hasValidCoordinates =
    Number.isFinite(value.locationLat) &&
    Number.isFinite(value.locationLng) &&
    Math.abs(value.locationLat ?? 0) <= 90 &&
    Math.abs(value.locationLng ?? 0) <= 180;

  const mapCenter: LatLngExpression = hasValidCoordinates
    ? [value.locationLat as number, value.locationLng as number]
    : DEFAULT_CENTER;

  const runSearch = useCallback(async (q: string) => {
    const cleanQuery = q.trim();

    if (cleanQuery.length < 3) {
      setSuggestions([]);
      setSearchState("idle");
      setShowSuggestions(false);
      return;
    }

    setSearchState("loading");
    setShowSuggestions(true);

    try {
      const results = await searchLocations(cleanQuery);
      setSuggestions(results);
      setSearchState("done");
    } catch {
      setSuggestions([]);
      setSearchState("error");
    }
  }, []);

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const nextQuery = e.target.value;

    setQuery(nextQuery);
    onChange({
      ...value,
      locationText: nextQuery,
      locationProvider: "manual",
    });

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      void runSearch(nextQuery);
    }, DEBOUNCE_MS);
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

  function handleSuggestionSelect(suggestion: LocationSuggestion): void {
    setQuery(suggestion.displayName);
    setShowSuggestions(false);
    setSuggestions([]);
    setSearchState("idle");
    setShowMap(true);

    onChange({
      ...value,
      locationText: suggestion.displayName,
      locationLat: suggestion.lat,
      locationLng: suggestion.lng,
      locationProvider: "osm",
      locationUrl: null,
    });
  }

  useEffect(() => {
    if (!showSuggestions) return;

    function updateSuggestionsPosition(): void {
      const inputWrap = inputWrapRef.current;
      if (!inputWrap) return;

      const rect = inputWrap.getBoundingClientRect();

      setSuggestionsStyle({
        left: rect.left,
        top: rect.bottom + 6,
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

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent): void {
      const target = e.target as Node;

      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  async function handleMapPick(lat: number, lng: number): Promise<void> {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    setIsReverseGeocoding(true);

    onChange({
      ...value,
      locationLat: lat,
      locationLng: lng,
      locationProvider: "osm",
    });

    try {
      const address = await reverseGeocode(lat, lng);
      const nextText = address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      setQuery(nextText);

      onChange({
        ...value,
        locationLat: lat,
        locationLng: lng,
        locationText: nextText,
        locationProvider: "osm",
        locationUrl: null,
      });
    } catch {
      const nextText = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      setQuery(nextText);

      onChange({
        ...value,
        locationLat: lat,
        locationLng: lng,
        locationText: nextText,
        locationProvider: "osm",
        locationUrl: null,
      });
    } finally {
      setIsReverseGeocoding(false);
    }
  }

  function handleUseCurrentLocation(): void {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setShowMap(true);
        void handleMapPick(latitude, longitude);
      },
      () => {
        // User denied geolocation or browser failed. Keep the form usable.
      },
    );
  }

  function handleOpenGoogleMaps(): void {
    const url = buildGoogleMapsUrl(
      value.locationLat,
      value.locationLng,
      value.locationText,
    );

    if (!url) return;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  const hasGoogleMapsTarget = Boolean(
    (value.locationLat != null && value.locationLng != null) ||
      value.locationText?.trim(),
  );

  return (
    <div className={`ev-location${isRtl ? " ev-location--rtl" : ""}`}>
      <div className="ev-location__label-row">
        <div className="ev-location__label-main">
          <MapPin size={13} className="ev-location__icon" />
          <span className="auth-form__label">
            {t("calendar.modal.location")}
          </span>
        </div>

        <button
          className="ev-location__toggle-map"
          onClick={() => setShowMap((current) => !current)}
          title={
            showMap
              ? t("calendar.modal.location.hideMap")
              : t("calendar.modal.location.showMap")
          }
          type="button"
        >
          {showMap
            ? t("calendar.modal.location.hideMap")
            : t("calendar.modal.location.showMap")}
        </button>
      </div>

      <div className="ev-location__input-wrap" ref={inputWrapRef}>
        <input
          ref={inputRef}
          autoComplete="off"
          className={`auth-form__input ev-location__input${
            isRtl ? " ev-location__input--rtl" : ""
          }`}
          onChange={handleQueryChange}
          onFocus={() => {
            if (suggestions.length > 0 || searchState === "loading") {
              setShowSuggestions(true);
            }
          }}
          placeholder={t("calendar.modal.placeholders.locationText")}
          value={query}
        />

        <div className="ev-location__input-icons">
          {(searchState === "loading" || isReverseGeocoding) && (
            <Loader size={14} className="ev-location__spinner" />
          )}

          {query.trim() &&
            searchState !== "loading" &&
            !isReverseGeocoding && (
              <button
                className="ev-location__clear"
                onClick={handleClearQuery}
                tabIndex={-1}
                title={t("common.clear")}
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
      </div>

      {showSuggestions && portalTarget && suggestionsStyle
        ? createPortal(
            <div
              ref={suggestionsRef}
              className={`ev-location__suggestions${
                isRtl ? " ev-location__suggestions--rtl" : ""
              }`}
              role="listbox"
              style={{
                left: `${suggestionsStyle.left}px`,
                top: `${suggestionsStyle.top}px`,
                width: `${suggestionsStyle.width}px`,
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

              {suggestions.map((suggestion) => (
                <button
                  className="ev-location__sugg-item"
                  key={suggestion.placeId}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  role="option"
                  type="button"
                >
                  <MapPin size={12} className="ev-location__sugg-icon" />
                  <span className="ev-location__sugg-text">
                    {suggestion.shortLabel || suggestion.displayName}
                  </span>
                </button>
              ))}
            </div>,
            portalTarget,
          )
        : null}

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
              <div className="ev-location__map-error">
                {t("calendar.modal.location.mapLoadError")}
              </div>
            ) : (
              <>
                <MapContainer
                  center={mapCenter}
                  className="ev-location__map"
                  scrollWheelZoom={false}
                  zoom={hasValidCoordinates ? 14 : 10}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    eventHandlers={{
                      tileerror: () => setMapError(true),
                    }}
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <MapViewUpdater center={mapCenter} />
                  <MapSizeInvalidator active={showMap} />
                  <MapClickHandler
                    onPick={(lat, lng) => {
                      void handleMapPick(lat, lng);
                    }}
                  />

                  {hasValidCoordinates && (
                    <Marker
                      position={[
                        value.locationLat as number,
                        value.locationLng as number,
                      ]}
                    />
                  )}
                </MapContainer>

                <p className="ev-location__map-hint">
                  {t("calendar.modal.location.clickHint")}
                </p>
              </>
            )}
          </MapRenderBoundary>
        </div>
      )}

      {(hasValidCoordinates || value.locationText?.trim()) && (
        <div
          className={`ev-location__summary${
            isRtl ? " ev-location__summary--rtl" : ""
          }`}
        >
          {hasValidCoordinates && (
            <span className="ev-location__coords">
              {(value.locationLat as number).toFixed(4)},{" "}
              {(value.locationLng as number).toFixed(4)}
            </span>
          )}

          <button
            className={`ev-location__gmaps-btn${
              !hasGoogleMapsTarget ? " ev-location__gmaps-btn--disabled" : ""
            }`}
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