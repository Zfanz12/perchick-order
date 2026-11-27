'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Crosshair,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
  X,
} from 'lucide-react';
import type { MapPinLocation } from '@/types/order';

interface NominatimSearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface DropPinMapInnerProps {
  value: MapPinLocation | null | undefined;
  onChange: (pin: MapPinLocation) => void;
}

// Default center (Dayeuhkolot / Bandung area) before user drops/searches/GPS
const DEFAULT_LAT = -6.973007;
const DEFAULT_LNG = 107.630381;
const DEFAULT_ZOOM = 14;

function buildGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

function createPerchickPinIcon(): L.DivIcon {
  return L.divIcon({
    className: 'perchick-map-pin',
    html: `
      <div style="position:relative;width:36px;height:44px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 4px 4px rgba(0,0,0,0.35));">
        <svg viewBox="0 0 36 44" width="36" height="44" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 2C9.716 2 3 8.716 3 17c0 10.5 15 25 15 25s15-14.5 15-25C33 8.716 26.284 2 18 2z" fill="#D91E18" stroke="#1C1917" stroke-width="2.5"/>
          <circle cx="18" cy="17" r="6.5" fill="#FFC72C" stroke="#1C1917" stroke-width="2"/>
        </svg>
      </div>
    `,
    iconSize: [36, 44],
    iconAnchor: [18, 42],
  });
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const fallback = `Pin Lokasi (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=id&lat=${lat}&lon=${lng}`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return fallback;
    const data = (await res.json()) as { display_name?: string };
    return data.display_name || fallback;
  } catch {
    return fallback;
  }
}

export function DropPinMapInner({ value, onChange }: DropPinMapInnerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const commitPinPosition = async (lat: number, lng: number, knownLabel?: string) => {
    setGpsError(null);
    const googleMapsUrl = buildGoogleMapsUrl(lat, lng);

    if (knownLabel) {
      onChangeRef.current({ label: knownLabel, lat, lng, googleMapsUrl });
      return;
    }

    // Immediately save coordinates so submit isn't blocked while reverse geocoding resolves
    onChangeRef.current({
      label: `Memuat nama lokasi (${lat.toFixed(5)}, ${lng.toFixed(5)})...`,
      lat,
      lng,
      googleMapsUrl,
    });

    setIsResolvingAddress(true);
    const label = await reverseGeocode(lat, lng);
    onChangeRef.current({ label, lat, lng, googleMapsUrl });
    setIsResolvingAddress(false);
  };

  // Initialize Leaflet Map once on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialLat = value?.lat ?? DEFAULT_LAT;
    const initialLng = value?.lng ?? DEFAULT_LNG;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: value ? 16 : DEFAULT_ZOOM,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    const pinIcon = createPerchickPinIcon();

    const placeOrMoveMarker = (lat: number, lng: number) => {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], {
          icon: pinIcon,
          draggable: true,
        }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          void commitPinPosition(pos.lat, pos.lng);
        });

        markerRef.current = marker;
      }
    };

    if (value) {
      placeOrMoveMarker(value.lat, value.lng);
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      placeOrMoveMarker(lat, lng);
      void commitPinPosition(lat, lng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external pin updates (from search result or GPS) onto map + marker
  const moveMapToCoordinate = (lat: number, lng: number, label?: string) => {
    const map = mapRef.current;
    if (map) {
      map.flyTo([lat, lng], 17, { duration: 0.65 });
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], {
          icon: createPerchickPinIcon(),
          draggable: true,
        }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          void commitPinPosition(pos.lat, pos.lng);
        });

        markerRef.current = marker;
      }
    }
    void commitPinPosition(lat, lng, label);
  };

  // Debounced Nominatim place search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 3) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=id&limit=5&accept-language=id&q=${encodeURIComponent(
            trimmed
          )}`,
          { signal: controller.signal, headers: { Accept: 'application/json' } }
        );
        if (!res.ok) throw new Error('Search failed');
        const data = (await res.json()) as NominatimSearchResult[];
        setSearchResults(data);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
      setIsSearching(false);
    };
  }, [searchQuery]);

  const handleUseGps = () => {
    setGpsError(null);
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGpsError('Browser tidak mendukung GPS. Tap langsung di peta untuk drop pin.');
      return;
    }

    setIsLocatingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocatingGps(false);
        moveMapToCoordinate(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setIsLocatingGps(false);
        setGpsError('Izin GPS ditolak. Tap atau geser pin langsung di peta.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const visibleResults = searchQuery.trim().length >= 3 ? searchResults : [];

  return (
    <div className="space-y-2.5">
      {/* Search Bar + GPS Button */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#78716C]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari jalan, kos, kampus, lalu geser pin..."
            className="min-h-[44px] w-full rounded-xl border-2 border-[#1C1917]/20 bg-white py-2 pl-9 pr-8 font-sans text-xs sm:text-sm text-[#1C1917] outline-none focus:border-[#D91E18]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
              aria-label="Hapus pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-[#78716C] hover:text-[#1C1917]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleUseGps}
          disabled={isLocatingGps}
          className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border-2 border-[#1C1917] bg-[#FFC72C] px-3 py-2 font-display text-xs font-bold text-[#1C1917] transition hover:bg-[#f5bc1b] disabled:opacity-60"
        >
          {isLocatingGps ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Crosshair className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Lokasi Saya</span>
        </button>

        {/* Autocomplete Dropdown */}
        {(isSearching || visibleResults.length > 0) && (
          <div className="absolute left-0 right-0 top-full z-[1000] mt-1.5 max-h-56 overflow-y-auto rounded-2xl border-2 border-[#1C1917] bg-white shadow-lg divide-y divide-[#1C1917]/10">
            {isSearching ? (
              <div className="flex items-center gap-2 px-3.5 py-3 text-xs font-semibold text-[#57534E]">
                <Loader2 className="h-4 w-4 animate-spin text-[#D91E18]" />
                <span>Mencari lokasi...</span>
              </div>
            ) : (
              visibleResults.map((item) => (
                <button
                  key={item.place_id}
                  type="button"
                  onClick={() => {
                    const lat = Number(item.lat);
                    const lng = Number(item.lon);
                    setSearchQuery('');
                    setSearchResults([]);
                    moveMapToCoordinate(lat, lng, item.display_name);
                  }}
                  className="flex w-full cursor-pointer items-start gap-2 px-3.5 py-2.5 text-left text-xs transition hover:bg-[#FFFBEB]"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D91E18]" />
                  <span className="font-medium leading-snug text-[#1C1917]">
                    {item.display_name}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {gpsError && (
        <p className="font-sans text-xs font-semibold text-[#D91E18]">
          {gpsError}
        </p>
      )}

      {/* Interactive Leaflet Map Canvas */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-[#1C1917]">
        <div
          ref={mapContainerRef}
          className="h-[280px] w-full sm:h-[320px]"
          style={{ zIndex: 1 }}
        />

        {!value && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-[400] -translate-x-1/2 rounded-full border-2 border-[#1C1917] bg-white/95 px-3.5 py-1.5 font-sans text-[11px] font-bold text-[#1C1917] shadow-md whitespace-nowrap">
            Tap di peta untuk drop pin lokasi kamu
          </div>
        )}
      </div>

      {/* Selected Pin Info Bar */}
      {value && (
        <div className="rounded-xl border border-[#1C1917]/15 bg-white p-3 text-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D91E18]" />
              <div className="min-w-0">
                <p className="font-bold text-[#1C1917] leading-snug">
                  {isResolvingAddress ? 'Memuat alamat titik...' : value.label}
                </p>
                <p className="mt-0.5 text-[11px] text-[#78716C]">
                  {value.lat.toFixed(5)}, {value.lng.toFixed(5)} • Bisa tap ulang atau geser pin merah
                </p>
              </div>
            </div>

            <a
              href={value.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 font-bold text-[#D91E18] hover:underline"
            >
              Maps
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
