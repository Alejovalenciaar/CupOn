import { useEffect, useRef, useState } from 'react';
import { IconMapPin } from './Icons';

declare global {
  interface Window {
    L?: any;
  }
}

interface RestaurantMapProps {
  latitude?: number | null;
  longitude?: number | null;
  businessName?: string;
  address?: string;
  interactive?: boolean;
  heightClassName?: string;
  onLocationChange?: (lat: number, lng: number) => void;
}

// Coordenadas por defecto (Bogotá - Zona T)
const DEFAULT_LAT = 4.6768;
const DEFAULT_LNG = -74.0482;

export default function RestaurantMap({
  latitude,
  longitude,
  businessName,
  address,
  interactive = false,
  heightClassName = 'h-60',
  onLocationChange,
}: RestaurantMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [locating, setLocating] = useState(false);

  const hasValidCoords =
    typeof latitude === 'number' &&
    !Number.isNaN(latitude) &&
    typeof longitude === 'number' &&
    !Number.isNaN(longitude);

  const currentLat = hasValidCoords ? latitude! : DEFAULT_LAT;
  const currentLng = hasValidCoords ? longitude! : DEFAULT_LNG;

  useEffect(() => {
    const L = window.L;
    if (!L || !containerRef.current) return;

    if (!mapRef.current) {
      const map = L.map(containerRef.current, {
        center: [currentLat, currentLng],
        zoom: 15,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([currentLat, currentLng], {
        draggable: interactive,
      }).addTo(map);

      if (businessName || address) {
        marker.bindPopup(
          `<div style="font-family: sans-serif; font-size: 12px;">
            <strong>${businessName || 'Ubicación del local'}</strong>
            ${address ? `<br/><span>${address}</span>` : ''}
          </div>`
        );
      }

      if (interactive) {
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onLocationChange?.(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
        });

        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          onLocationChange?.(Number(lat.toFixed(6)), Number(lng.toFixed(6)));
        });
      }

      mapRef.current = map;
      markerRef.current = marker;

      setTimeout(() => {
        map.invalidateSize();
      }, 150);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive]);

  // Actualizar marcador si cambian las coordenadas desde fuera
  useEffect(() => {
    if (mapRef.current && markerRef.current && hasValidCoords) {
      markerRef.current.setLatLng([latitude, longitude]);
      mapRef.current.setView([latitude, longitude], mapRef.current.getZoom());
    }
  }, [latitude, longitude, hasValidCoords]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        onLocationChange?.(lat, lng);
        if (mapRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapRef.current.setView([lat, lng], 16);
        }
        setLocating(false);
      },
      () => {
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}`;

  return (
    <div className="space-y-2">
      <div className="relative rounded-card overflow-hidden border border-surface-border shadow-subtle bg-surface-muted">
        <div ref={containerRef} className={`w-full ${heightClassName} z-0`} />
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] text-content-secondary">
        {interactive ? (
          <>
            <span>Haz clic en el mapa o arrastra el marcador para fijar la ubicación exacta.</span>
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={locating}
              className="shrink-0 inline-flex items-center gap-1.5 bg-white hover:bg-surface-muted text-content-primary border border-surface-border px-2.5 py-1 rounded-button font-medium transition-colors shadow-subtle"
            >
              <IconMapPin size={13} />
              <span>{locating ? 'Ubicando...' : 'Usar mi ubicación'}</span>
            </button>
          </>
        ) : (
          <>
            <span className="truncate">{address || 'Ubicación del establecimiento'}</span>
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1"
            >
              <span>Abrir en Google Maps</span>
              <span>↗</span>
            </a>
          </>
        )}
      </div>
    </div>
  );
}

