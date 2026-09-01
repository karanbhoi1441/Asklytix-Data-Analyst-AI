import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { RegionData } from '@/types/dashboard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Globe,
  MapPin,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles,
  TrendingUp,
  Crosshair,
  RotateCcw,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GeographicWidgetProps {
  regions: RegionData[];
  title?: string;
  selectedRegion?: string | null;
  onSelectRegion?: (regionName: string | null) => void;
}

type MapTheme = 'dark' | 'streets' | 'satellite';

const TILE_SERVERS: Record<MapTheme, { url: string; attribution: string }> = {
  dark: {
    url: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
  },
  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar'
  }
};

export const GeographicWidget: React.FC<GeographicWidgetProps> = ({
  regions,
  title = 'Geographic Distribution',
  selectedRegion = null,
  onSelectRegion
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Distinct hover state vs selected state
  const [hoveredRegion, setHoveredRegion] = useState<RegionData | null>(null);
  const [mapTheme, setMapTheme] = useState<MapTheme>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Derive coordinates for fallback if missing
  const normalizedRegions: RegionData[] = React.useMemo(() => {
    return regions.map((r, i) => {
      let lat = r.lat;
      let lng = r.lng;

      if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) {
        // Default coordinates centered around Pune/Mumbai/Maharashtra region
        const baseLat = 18.5204;
        const baseLng = 73.8567;
        const angle = (i / Math.max(regions.length, 1)) * 2 * Math.PI;
        lat = baseLat + Math.sin(angle) * 1.2;
        lng = baseLng + Math.cos(angle) * 1.2;
      }

      return {
        ...r,
        lat,
        lng,
        records: r.records ?? Math.round(r.revenue / 1000) + 10,
        sharePct: r.sharePct ?? Math.round((r.intensity || 0.5) * 100)
      };
    });
  }, [regions]);

  // The active card displays the spot currently under the cursor (hovered), or if none hovered, the pinned selected location
  const displayedRegion = hoveredRegion || (selectedRegion ? normalizedRegions.find(r => r.name.toLowerCase() === selectedRegion.toLowerCase()) ?? null : null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create Leaflet map instance
      const map = L.map(mapContainerRef.current, {
        center: [19.7515, 75.7139], // Centered around Maharashtra/India by default
        zoom: 6,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false
      });

      // Add zoom control to top-left
      L.control.zoom({ position: 'topleft' }).addTo(map);

      // Add Tile Layer
      const currentThemeConfig = TILE_SERVERS[mapTheme];
      const tileLayer = L.tileLayer(currentThemeConfig.url, {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      // Mouse leaves map canvas completely -> clear hovered spot
      map.on('mouseout', () => {
        setHoveredRegion(null);
      });

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;
      setIsMapReady(true);
    }

    return () => {
      // Map cleanup
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Tile Layer on Theme Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const currentThemeConfig = TILE_SERVERS[mapTheme];
    const newTileLayer = L.tileLayer(currentThemeConfig.url, {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [mapTheme]);

  // Render & Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isMapReady || normalizedRegions.length === 0) return;

    // Clear old markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    const bounds = L.latLngBounds([]);

    normalizedRegions.forEach((reg) => {
      if (reg.lat === undefined || reg.lng === undefined) return;

      const isSelected = selectedRegion?.toLowerCase() === reg.name.toLowerCase();
      const isHovered = hoveredRegion?.name.toLowerCase() === reg.name.toLowerCase();
      const color = isSelected ? '#38bdf8' : reg.growth >= 0 ? '#06b6d4' : '#f43f5e';
      const size = isSelected ? 34 : 26;

      // Custom animated Radar Pulse HTML Marker
      const customIcon = L.divIcon({
        className: 'custom-geo-marker',
        html: `
          <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <!-- Outer Pulsing Ripple Wave -->
            <div style="
              position: absolute;
              inset: -8px;
              border-radius: 9999px;
              background-color: ${color};
              opacity: ${isSelected ? '0.5' : '0.25'};
              animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <!-- Glow Base -->
            <div style="
              position: absolute;
              inset: 0px;
              border-radius: 9999px;
              background: radial-gradient(circle, ${color} 0%, rgba(6,182,212,0.1) 70%);
              border: 2px solid ${isSelected ? '#ffffff' : color};
              box-shadow: 0 0 16px ${color};
              display: flex;
              align-items: center;
              justify-content: center;
              transition: transform 0.2s ease;
              ${isHovered || isSelected ? 'transform: scale(1.25);' : ''}
            ">
              <!-- Center Pin Dot -->
              <div style="width: 7px; height: 7px; border-radius: 9999px; background-color: #ffffff; box-shadow: 0 0 8px #ffffff;"></div>
            </div>
            <!-- City Floating Label -->
            <div style="
              position: absolute;
              bottom: -22px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(15, 23, 42, 0.92);
              border: 1px solid ${isSelected ? '#38bdf8' : 'rgba(51, 65, 85, 0.8)'};
              padding: 1px 7px;
              border-radius: 6px;
              font-family: monospace;
              font-size: 10px;
              font-weight: 700;
              color: #ffffff;
              white-space: nowrap;
              pointer-events: none;
              box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            ">
              ${reg.name}
            </div>
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });

      const marker = L.marker([reg.lat, reg.lng], { icon: customIcon }).addTo(map);

      // On click spot -> select/toggle and zoom
      marker.on('click', () => {
        if (onSelectRegion) {
          if (selectedRegion?.toLowerCase() === reg.name.toLowerCase()) {
            onSelectRegion(null); // Toggle off
          } else {
            onSelectRegion(reg.name);
          }
        }
        map.flyTo([reg.lat!, reg.lng!], Math.max(map.getZoom(), 8), {
          animate: true,
          duration: 1.2
        });
      });

      // Hover on spot -> Show spot information
      marker.on('mouseover', () => {
        setHoveredRegion(reg);
      });

      // Leaving spot (going another side) -> Clear spot information
      marker.on('mouseout', () => {
        setHoveredRegion(null);
      });

      markersRef.current.push(marker);
      bounds.extend([reg.lat, reg.lng]);
    });

    // Auto-fit map to show all coordinates
    if (bounds.isValid() && !selectedRegion) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }, [normalizedRegions, isMapReady, selectedRegion, hoveredRegion?.name, onSelectRegion]);

  // Handle fly to specific location from button
  const handleFlyToRegion = (reg: RegionData) => {
    if (onSelectRegion) {
      if (selectedRegion?.toLowerCase() === reg.name.toLowerCase()) {
        onSelectRegion(null);
      } else {
        onSelectRegion(reg.name);
      }
    }
    const map = mapInstanceRef.current;
    if (map && reg.lat !== undefined && reg.lng !== undefined) {
      map.flyTo([reg.lat, reg.lng], 9, { animate: true, duration: 1.2 });
    }
  };

  // Reset View to fit all points
  const handleResetView = () => {
    if (onSelectRegion) onSelectRegion(null);
    setHoveredRegion(null);
    const map = mapInstanceRef.current;
    if (!map || normalizedRegions.length === 0) return;
    const bounds = L.latLngBounds(
      normalizedRegions
        .filter((r) => r.lat !== undefined && r.lng !== undefined)
        .map((r) => [r.lat!, r.lng!])
    );
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
    }
  };

  return (
    <Card
      variant="glass"
      className={`w-full border-cyan-500/30 p-5 shadow-2xl backdrop-blur-xl relative transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-hidden flex flex-col bg-slate-950/98' : ''
      }`}
    >
      {/* ── Top Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base tracking-wide flex items-center gap-2">
                {title}
              </h3>
              <Badge variant="primary" size="sm" className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30">
                <Sparkles className="w-3 h-3 mr-1 text-cyan-400" />
                Live Real-Time Map
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {selectedRegion ? (
                <span className="text-cyan-400 font-semibold">
                  Filtered by: {selectedRegion} · Hover spot to preview, click to toggle
                </span>
              ) : (
                'Hover any location spot to view live details · Click spot to isolate all visual boxes'
              )}
            </p>
          </div>
        </div>

        {/* Map Controls */}
        <div className="flex items-center gap-2">
          {/* Layer switcher */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-0.5">
            <button
              onClick={() => setMapTheme('dark')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                mapTheme === 'dark'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Dark Cyberpunk Tiles"
            >
              Dark
            </button>
            <button
              onClick={() => setMapTheme('streets')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                mapTheme === 'streets'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="OpenStreetMap Standard Tiles"
            >
              Streets
            </button>
            <button
              onClick={() => setMapTheme('satellite')}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                mapTheme === 'satellite'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Satellite Imagery"
            >
              Satellite
            </button>
          </div>

          {/* Reset button */}
          <button
            onClick={handleResetView}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all cursor-pointer"
            title="Reset Map View & Clear Filter"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => {
              setIsFullscreen((prev) => !prev);
              setTimeout(() => {
                mapInstanceRef.current?.invalidateSize();
              }, 250);
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Real-Time Interactive Map Canvas ── */}
      <div
        className={`relative w-full rounded-2xl border border-cyan-500/20 overflow-hidden shadow-inner bg-[#060a14] ${
          isFullscreen ? 'flex-1 min-h-[450px]' : 'h-80'
        }`}
      >
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Ambient Map HUD Overlay Header */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 text-white shadow-xl flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-cyan-400 font-bold">{normalizedRegions.length} Locations</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">Live GPS Telemetry</span>
          </div>
        </div>

        {/* Floating Spot Telemetry Card (Only visible when hovering over a spot or when pinned) */}
        <AnimatePresence>
          {displayedRegion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-3 right-3 z-10 p-4 bg-slate-950/95 border border-cyan-500/50 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.25)] text-xs font-mono backdrop-blur-xl space-y-2.5 max-w-[260px] pointer-events-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="font-black text-white text-sm flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>{displayedRegion.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Badge
                    variant={selectedRegion?.toLowerCase() === displayedRegion.name.toLowerCase() ? 'success' : 'outline'}
                    size="sm"
                  >
                    {selectedRegion?.toLowerCase() === displayedRegion.name.toLowerCase() ? 'Filtered' : 'Spot Info'}
                  </Badge>
                  {selectedRegion?.toLowerCase() === displayedRegion.name.toLowerCase() && onSelectRegion && (
                    <button
                      onClick={() => onSelectRegion(null)}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Clear location filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">REVENUE</span>
                  <span className="font-bold text-cyan-300 text-xs">
                    ${displayedRegion.revenue.toLocaleString()}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">DATA SHARE</span>
                  <span className="font-bold text-purple-300 text-xs">
                    {displayedRegion.sharePct || 25}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] px-1 text-slate-400">
                <span>Growth Rate</span>
                <span
                  className={`font-bold flex items-center gap-1 ${
                    displayedRegion.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  {displayedRegion.growth >= 0 ? '+' : ''}{displayedRegion.growth}%
                </span>
              </div>

              {displayedRegion.lat !== undefined && displayedRegion.lng !== undefined && (
                <div className="text-[10px] text-slate-500 flex items-center justify-between px-1 font-mono">
                  <span>Coordinates</span>
                  <span>{displayedRegion.lat.toFixed(2)}°N, {displayedRegion.lng.toFixed(2)}°E</span>
                </div>
              )}

              {onSelectRegion && (
                <button
                  onClick={() => handleFlyToRegion(displayedRegion)}
                  className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedRegion?.toLowerCase() === displayedRegion.name.toLowerCase()
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  }`}
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  {selectedRegion?.toLowerCase() === displayedRegion.name.toLowerCase()
                    ? 'Clear Filter (Show All)'
                    : 'Filter All Visual Boxes'}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Connected Touch Location Selector Chips ── */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Touch-Linked Location Selector
          </span>
          {selectedRegion && (
            <button
              onClick={handleResetView}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              Reset to Global View
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Global All Chip */}
          <button
            onClick={handleResetView}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              !selectedRegion
                ? 'bg-cyan-500/15 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div>
              <span className="text-xs font-bold text-white block">All Locations</span>
              <span className="text-[10px] font-mono text-slate-400">Global Dataset</span>
            </div>
            {!selectedRegion && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
          </button>

          {/* Individual City Chips */}
          {normalizedRegions.slice(0, 7).map((r) => {
            const isSelected = selectedRegion?.toLowerCase() === r.name.toLowerCase();
            return (
              <button
                key={r.id}
                onClick={() => handleFlyToRegion(r)}
                onMouseEnter={() => setHoveredRegion(r)}
                onMouseLeave={() => setHoveredRegion(null)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-gradient-to-tr from-cyan-500/25 to-blue-600/25 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400'
                    : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/40 text-slate-300'
                }`}
              >
                <div className="truncate pr-1">
                  <span className="text-xs font-bold text-white block truncate">{r.name}</span>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold">
                    ${(r.revenue / 1000).toFixed(0)}k · {r.sharePct || 25}%
                  </span>
                </div>
                {isSelected ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8] shrink-0" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
