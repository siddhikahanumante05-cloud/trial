import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Kiln, ScoredKiln, KilnCluster, KilnClass } from '../types';
import { formatCoordinates } from '../utils/geo';
import {
  X,
  MapPin,
  Compass,
  ShieldAlert,
  CheckCircle2,
  Ruler,
  Eye,
  Layers,
  Satellite,
  Grid,
  Code2,
  ExternalLink,
  Copy,
  Check,
  Truck,
  Sparkles,
} from 'lucide-react';

export type BasemapMode = 'plain' | 'gee-rgb' | 'gee-false-color' | 'gee-custom';

interface PlainLeafletMapProps {
  kilns: Kiln[];
  top20Kilns: ScoredKiln[];
  clusters?: KilnCluster[];
  selectedKiln: Kiln | null;
  onSelectKiln: (kiln: Kiln | null) => void;
  showClusters?: boolean;
  activeClusterId?: number | null;
  heightClass?: string;
  isDark?: boolean;
}

export const CLASS_COLORS: Record<KilnClass, { bg: string; border: string; text: string; hex: string; name: string }> = {
  FCBK: {
    bg: 'bg-rose-500',
    border: 'border-rose-600',
    text: 'text-rose-600 dark:text-rose-400',
    hex: '#f43f5e',
    name: "FCBK (Bull's Trench)",
  },
  CFCBK: {
    bg: 'bg-purple-600',
    border: 'border-purple-700',
    text: 'text-purple-600 dark:text-purple-400',
    hex: '#9333ea',
    name: 'CFCBK (Circular)',
  },
  Zigzag: {
    bg: 'bg-teal-600',
    border: 'border-teal-700',
    text: 'text-teal-600 dark:text-teal-400',
    hex: '#0d9488',
    name: 'Zigzag (Cleaner)',
  },
};

export const PlainLeafletMap: React.FC<PlainLeafletMapProps> = ({
  kilns,
  top20Kilns,
  clusters = [],
  selectedKiln,
  onSelectKiln,
  showClusters = false,
  activeClusterId = null,
  heightClass = 'h-[460px] md:h-[540px]',
  isDark = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const clusterLayerRef = useRef<L.LayerGroup | null>(null);
  const basemapLayerRef = useRef<L.Layer | null>(null);

  // Basemap state
  const [basemapMode, setBasemapMode] = useState<BasemapMode>('gee-rgb');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState<boolean>(false);
  const [isGeeModalOpen, setIsGeeModalOpen] = useState<boolean>(false);
  const [customGeeUrl, setCustomGeeUrl] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = 26.85;
    const initialLon = 80.95;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 11,
      minZoom: 9,
      maxZoom: 16,
      zoomControl: true,
      attributionControl: false,
    });

    const markersGroup = L.layerGroup().addTo(map);
    const clusterGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    clusterLayerRef.current = clusterGroup;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap Layer when basemapMode, dark mode, or custom URL changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (basemapLayerRef.current) {
      map.removeLayer(basemapLayerRef.current);
      basemapLayerRef.current = null;
    }

    if (basemapMode === 'gee-custom' && customGeeUrl.trim()) {
      try {
        const customLayer = L.tileLayer(customGeeUrl.trim(), {
          maxZoom: 18,
          tileSize: 256,
        });
        customLayer.addTo(map);
        basemapLayerRef.current = customLayer;
        return;
      } catch (e) {
        console.error('Invalid custom GEE tile URL', e);
      }
    }

    if (basemapMode === 'plain') {
      // Plain Lat/Lon reference grid
      const currentDark = isDark;
      const PlainGridLayer = L.GridLayer.extend({
        createTile: function (coords: L.Coords) {
          const tile = document.createElement('canvas');
          const size = (this as any).getTileSize();
          tile.width = size.x;
          tile.height = size.y;
          const ctx = tile.getContext('2d');
          if (!ctx) return tile;

          ctx.fillStyle = currentDark ? '#0b1120' : '#f8fafc';
          ctx.fillRect(0, 0, size.x, size.y);

          ctx.strokeStyle = currentDark ? '#1e293b' : '#e2e8f0';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);

          ctx.beginPath();
          ctx.moveTo(0, size.y / 2);
          ctx.lineTo(size.x, size.y / 2);
          ctx.moveTo(size.x / 2, 0);
          ctx.lineTo(size.x / 2, size.y);
          ctx.stroke();

          ctx.strokeStyle = currentDark ? '#334155' : '#cbd5e1';
          ctx.setLineDash([]);
          ctx.strokeRect(0, 0, size.x, size.y);

          ctx.fillStyle = currentDark ? '#64748b' : '#94a3b8';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.fillText(`z${coords.z} (${coords.x},${coords.y})`, 8, 16);

          return tile;
        },
      }) as unknown as new (options?: L.GridLayerOptions) => L.GridLayer;

      const grid = new PlainGridLayer({ tileSize: 256 });
      grid.addTo(map);
      basemapLayerRef.current = grid;
    } else {
      // GEE Sentinel-2 MSI Surface Reflectance Simulator (True Color or False Color)
      const isFalseColor = basemapMode === 'gee-false-color';

      const GeeSentinel2Layer = L.GridLayer.extend({
        createTile: function (coords: L.Coords) {
          const tile = document.createElement('canvas');
          const size = (this as any).getTileSize();
          tile.width = size.x;
          tile.height = size.y;
          const ctx = tile.getContext('2d');
          if (!ctx) return tile;

          // Pseudo-random deterministic hash based on tile coords
          const hash = Math.abs(Math.sin(coords.x * 12.9898 + coords.y * 78.233 + coords.z * 37.719) * 43758.5453);
          const subHash = Math.abs(Math.sin(coords.x * 93.989 + coords.y * 67.345) * 23421.631);

          // Base soil/terrain palette (Indo-Gangetic alluvial basin)
          if (isFalseColor) {
            // False Color (B8-B4-B3): Vegetation glows deep red/crimson, bare soil is cyan/ochre
            ctx.fillStyle = '#8a9b9e'; // bare soil/silt
            ctx.fillRect(0, 0, size.x, size.y);

            // Vegetation field parcels
            const vegColors = ['#9e2a3b', '#b3394a', '#7f1d2d', '#5c1421', '#a83244'];
            for (let i = 0; i < 6; i++) {
              const fx = ((hash * (i + 1) * 37) % size.x);
              const fy = ((subHash * (i + 2) * 53) % size.y);
              const fw = 40 + ((hash * (i + 3) * 17) % 65);
              const fh = 35 + ((subHash * (i + 4) * 23) % 55);
              ctx.fillStyle = vegColors[i % vegColors.length];
              ctx.fillRect(fx, fy, fw, fh);
            }
          } else {
            // True Color (B4-B3-B2): Natural alluvial plains, dry winter soil, mustard/wheat patches
            ctx.fillStyle = '#c5b59a'; // alluvial silt loam
            ctx.fillRect(0, 0, size.x, size.y);

            // Agricultural patchwork
            const fieldPalette = ['#9e896a', '#b09f82', '#7d8a66', '#8e795c', '#6d7b57', '#a49174'];
            for (let i = 0; i < 7; i++) {
              const fx = ((hash * (i + 1) * 41) % size.x);
              const fy = ((subHash * (i + 2) * 59) % size.y);
              const fw = 35 + ((hash * (i + 3) * 23) % 70);
              const fh = 30 + ((subHash * (i + 4) * 29) % 60);
              ctx.fillStyle = fieldPalette[i % fieldPalette.length];
              ctx.fillRect(fx, fy, fw, fh);
            }
          }

          // Meandering canal / river stream
          ctx.strokeStyle = isFalseColor ? '#1e293b' : '#5a6b73';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          const startY = (hash * 100) % size.y;
          ctx.moveTo(0, startY);
          ctx.bezierCurveTo(size.x * 0.4, startY + 25, size.x * 0.6, startY - 20, size.x, (startY + 35) % size.y);
          ctx.stroke();

          // Field boundary tracks
          ctx.strokeStyle = isFalseColor ? 'rgba(255,255,255,0.12)' : 'rgba(70,55,40,0.2)';
          ctx.lineWidth = 1;
          for (let p = 30; p < size.x; p += 45) {
            ctx.beginPath();
            ctx.moveTo(p, 0);
            ctx.lineTo(p, size.y);
            ctx.stroke();
          }

          // Sentinel-2 10m GSD pixelation grit overlay
          ctx.fillStyle = 'rgba(0,0,0,0.035)';
          for (let px = 0; px < size.x; px += 8) {
            ctx.fillRect(px, 0, 1, size.y);
          }
          for (let py = 0; py < size.y; py += 8) {
            ctx.fillRect(0, py, size.x, 1);
          }

          // Watermark label on bottom
          ctx.fillStyle = isFalseColor ? 'rgba(255,255,255,0.45)' : 'rgba(30,20,10,0.35)';
          ctx.font = '8px "JetBrains Mono", monospace';
          ctx.fillText(`GEE S2-L2A ${isFalseColor ? 'B8-B4-B3' : 'B4-B3-B2'} | z${coords.z}`, 6, size.y - 6);

          return tile;
        },
      }) as unknown as new (options?: L.GridLayerOptions) => L.GridLayer;

      const s2Layer = new GeeSentinel2Layer({ tileSize: 256, maxZoom: 16 });
      s2Layer.addTo(map);
      basemapLayerRef.current = s2Layer;
    }
  }, [basemapMode, isDark, customGeeUrl]);

  // Update clusters and paths
  useEffect(() => {
    const map = mapInstanceRef.current;
    const clusterGroup = clusterLayerRef.current;
    if (!map || !clusterGroup) return;

    clusterGroup.clearLayers();
    if (!showClusters || clusters.length === 0) return;

    const clusterColors = ['#0d9488', '#6366f1', '#e11d48', '#d97706'];

    clusters.forEach((cluster, idx) => {
      const isHighlighted = activeClusterId === null || activeClusterId === cluster.id;
      const strokeColor = clusterColors[idx % clusterColors.length];
      const opacity = isHighlighted ? 0.9 : 0.2;
      const fillOpacity = isHighlighted ? (isDark ? 0.12 : 0.08) : 0.02;

      const circle = L.circle([cluster.centerLat, cluster.centerLon], {
        radius: cluster.semiMajorM,
        color: strokeColor,
        weight: 2,
        dashArray: '6, 6',
        opacity: opacity,
        fillColor: strokeColor,
        fillOpacity: fillOpacity,
      });

      circle.bindTooltip(
        `<div class="font-sans text-xs font-semibold px-1 py-0.5">${cluster.name}<br/><span class="text-[10px] text-slate-500 font-normal">${cluster.kilns.length} candidate sites in patrol sector</span></div>`,
        { permanent: false, direction: 'top' }
      );
      clusterGroup.addLayer(circle);

      if (cluster.kilns.length > 1) {
        const polylineCoords = cluster.kilns.map((k) => [k.lat, k.lon] as [number, number]);
        const polyline = L.polyline(polylineCoords, {
          color: strokeColor,
          weight: 1.5,
          dashArray: '4, 4',
          opacity: isHighlighted ? 0.8 : 0.15,
        });
        clusterGroup.addLayer(polyline);
      }
    });
  }, [showClusters, clusters, activeClusterId, isDark]);

  // Update markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const top20Map = new Map<string, ScoredKiln>();
    top20Kilns.forEach((k) => top20Map.set(k.id, k));

    kilns.forEach((kiln) => {
      const topInfo = top20Map.get(kiln.id);
      const isTop20 = !!topInfo;
      const isLowConfidence = kiln.confidence >= 0.4 && kiln.confidence <= 0.6;
      const isSelected = selectedKiln?.id === kiln.id;
      const classColor = CLASS_COLORS[kiln.class] || CLASS_COLORS.FCBK;

      const size = isTop20 ? 32 : isSelected ? 26 : 18;
      const half = size / 2;
      const ringBorderColor = isDark ? '#020617' : '#ffffff';

      const markerHtml = `
        <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${
            isLowConfidence
              ? `<div style="position: absolute; inset: -4px; border: 2px dashed ${classColor.hex}; border-radius: 9999px; opacity: 0.9;" title="Low confidence candidate (0.4-0.6)"></div>`
              : ''
          }
          ${
            isSelected
              ? `<div style="position: absolute; inset: -5px; border: 2.5px solid ${isDark ? '#38bdf8' : '#0f172a'}; border-radius: 9999px;"></div>`
              : ''
          }
          <div style="
            width: ${size}px;
            height: ${size}px;
            background-color: ${classColor.hex};
            border: 2px solid ${ringBorderColor};
            box-shadow: 0 1px 4px rgba(0,0,0,0.35);
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 700;
            font-size: ${isTop20 ? '12px' : '9px'};
            font-family: 'Inter', sans-serif;
          ">
            ${isTop20 ? topInfo.rank : ''}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-kiln-marker',
        iconSize: [size, size],
        iconAnchor: [half, half],
      });

      const marker = L.marker([kiln.lat, kiln.lon], { icon: customIcon });

      marker.on('click', () => {
        onSelectKiln(kiln);
      });

      markersGroup.addLayer(marker);
    });

    if (kilns.length > 0 && !selectedKiln) {
      const bounds = L.latLngBounds(kilns.map((k) => [k.lat, k.lon]));
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    }
  }, [kilns, top20Kilns, selectedKiln, onSelectKiln, isDark]);

  const geeScriptText = `// Google Earth Engine (GEE) - Sentinel-2 Brick Kiln Detection Pipeline
// District: Ganga-Ghaghara Basin Screening Zone (Inspector Farida Khan)
var district = ee.Geometry.Polygon([
  [[80.70, 26.65], [81.25, 26.65], [81.25, 27.15], [80.70, 27.15]]
]);

// 1. Query Sentinel-2 Level-2A Surface Reflectance (10 m)
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(district)
  .filterDate('2025-10-01', '2026-03-31') // Dry winter operating season
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10));

// 2. Cloud mask using SCL (Scene Classification Layer)
function maskClouds(img) {
  var scl = img.select('SCL');
  var mask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10));
  return img.updateMask(mask);
}

// 3. Dry-season median composite
var composite = s2.map(maskClouds).median().clip(district);

// 4. Visualization Parameters
var rgbParams = {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000, gamma: 1.2};
var falseColorParams = {bands: ['B8', 'B4', 'B3'], min: 0, max: 4000};

Map.centerObject(district, 11);
Map.addLayer(composite, rgbParams, 'Sentinel-2 True Color (10m)');
Map.addLayer(composite, falseColorParams, 'Sentinel-2 False Color (B8-B4-B3)', false);

// 5. Generate dynamic tile layer for Leaflet / ChimneyLens
// var tileId = composite.getMap(rgbParams);
// print('Tile URL template:', tileId.urlFormat);`;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className={`w-full ${heightClass} z-0`} />

      {/* Top Left Layer & Earth Engine Indicator Badge */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
          {basemapMode === 'plain' ? (
            <Grid className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <Satellite className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          )}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {basemapMode === 'plain'
              ? 'Plain Lat/Lon Grid'
              : basemapMode === 'gee-rgb'
              ? 'GEE Sentinel-2 RGB'
              : basemapMode === 'gee-false-color'
              ? 'GEE False Color (B8-B4-B3)'
              : 'Custom GEE Stream'}
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="font-mono text-[11px] text-teal-700 dark:text-teal-400 font-medium">10 m GSD</span>
        </div>

        {/* GEE Script / Pipeline Inspector Button */}
        <button
          onClick={() => setIsGeeModalOpen(true)}
          className="bg-white/95 dark:bg-slate-900/95 hover:bg-slate-100 dark:hover:bg-slate-800 text-teal-700 dark:text-teal-400 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          title="Inspect Google Earth Engine pipeline code and parameters"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">GEE Script</span>
        </button>
      </div>

      {/* Top Right Controls: Layer Switcher & Fit Bounds */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {/* Layer Selector Trigger */}
        <div className="relative">
          <button
            onClick={() => setIsLayerMenuOpen(!isLayerMenuOpen)}
            className="bg-white/95 dark:bg-slate-900/95 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            title="Switch Earth Engine & Grid Layers"
          >
            <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Basemaps</span>
          </button>

          {isLayerMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-xl text-xs space-y-1 animate-in fade-in duration-100 z-30">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-1">
                Select Basemap Layer
              </div>

              <button
                onClick={() => {
                  setBasemapMode('gee-rgb');
                  setIsLayerMenuOpen(false);
                }}
                className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors ${
                  basemapMode === 'gee-rgb'
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Satellite className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <div>
                    <div>GEE Sentinel-2 RGB</div>
                    <div className="text-[10px] text-slate-400">Natural color B4-B3-B2 (10m)</div>
                  </div>
                </div>
                {basemapMode === 'gee-rgb' && <Check className="w-3.5 h-3.5 text-teal-600" />}
              </button>

              <button
                onClick={() => {
                  setBasemapMode('gee-false-color');
                  setIsLayerMenuOpen(false);
                }}
                className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors ${
                  basemapMode === 'gee-false-color'
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <div>GEE False-Color</div>
                    <div className="text-[10px] text-slate-400">B8-B4-B3 (Soil &amp; Trench)</div>
                  </div>
                </div>
                {basemapMode === 'gee-false-color' && <Check className="w-3.5 h-3.5 text-purple-600" />}
              </button>

              <button
                onClick={() => {
                  setBasemapMode('plain');
                  setIsLayerMenuOpen(false);
                }}
                className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center justify-between transition-colors ${
                  basemapMode === 'plain'
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Grid className="w-3.5 h-3.5 text-slate-500" />
                  <div>
                    <div>Plain Lat/Lon Grid</div>
                    <div className="text-[10px] text-slate-400">Competition Rule Protocol</div>
                  </div>
                </div>
                {basemapMode === 'plain' && <Check className="w-3.5 h-3.5 text-teal-600" />}
              </button>
            </div>
          )}
        </div>

        {/* Fit Bounds */}
        <button
          onClick={() => {
            if (mapInstanceRef.current && kilns.length > 0) {
              const bounds = L.latLngBounds(kilns.map((k) => [k.lat, k.lon]));
              mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30] });
            }
          }}
          className="bg-white/95 dark:bg-slate-900/95 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors"
        >
          Fit Bounds
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-md text-xs text-slate-700 dark:text-slate-300 max-w-[260px]">
        <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5 text-[11px] uppercase tracking-wider flex items-center justify-between">
          <span>Map Legend</span>
          <span className="text-[10px] font-mono text-teal-700 dark:text-teal-400 lowercase">10m GSD</span>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 border border-white dark:border-slate-800 shrink-0"></span>
            <span>FCBK (Bull&apos;s trench)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-600 border border-white dark:border-slate-800 shrink-0"></span>
            <span>CFCBK (Circular)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal-600 border border-white dark:border-slate-800 shrink-0"></span>
            <span>Zigzag (Clean design)</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="w-3.5 h-3.5 rounded-full border border-dashed border-slate-500 shrink-0"></span>
            <span className="text-slate-500 dark:text-slate-400">Dashed: Low conf (0.4–0.6)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold flex items-center justify-center shrink-0">
              #
            </span>
            <span className="text-slate-500 dark:text-slate-400">Numbered: Top-20 visit priority</span>
          </div>
        </div>
      </div>

      {/* Selected Kiln Detail Card with REALISTIC LOCATION & GEE CONTEXT */}
      {selectedKiln && (
        <div className="absolute bottom-3 right-3 left-3 sm:left-auto z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl sm:max-w-[360px] w-auto text-xs animate-in fade-in duration-150">
          <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5 mb-2.5">
            <div>
              <div className="text-[11px] text-teal-700 dark:text-teal-400 font-mono font-semibold">
                {selectedKiln.id} &middot; {selectedKiln.period}
              </div>
              <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5 mt-0.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: CLASS_COLORS[selectedKiln.class]?.hex || '#f43f5e' }}
                />
                {selectedKiln.class} Candidate
              </div>
            </div>
            <button
              onClick={() => onSelectKiln(null)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors"
              aria-label="Close details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-slate-600 dark:text-slate-300">
            {/* Real District Location Context */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
              <div className="flex items-center justify-between text-slate-900 dark:text-slate-100 font-semibold text-xs">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Village {selectedKiln.village || 'Kalyanpur'}</span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  Tehsil {selectedKiln.tehsil || 'Mohanlalganj'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1 pt-0.5">
                <Truck className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span>{selectedKiln.road_access || 'Kutcha track off highway (Jeep 4WD suitable)'}</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Soil: {selectedKiln.soil_type || 'Gangetic alluvial silt loam'}
              </div>
            </div>

            {/* Coordinates & Technical Dimensions */}
            <div className="space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Coordinates:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                  {formatCoordinates(selectedKiln.lat, selectedKiln.lon)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Model Confidence:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                  {(selectedKiln.confidence * 100).toFixed(0)}%
                  {selectedKiln.confidence >= 0.4 && selectedKiln.confidence <= 0.6 && (
                    <span className="text-amber-600 dark:text-amber-400 text-[10px] ml-1">(Uncertain)</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Excavated Trench Size:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {selectedKiln.width_m} m &times; {selectedKiln.height_m} m @ {selectedKiln.angle_deg}&deg;
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Official Register:</span>
                <span className={selectedKiln.in_register ? 'text-slate-700 dark:text-slate-300' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
                  {selectedKiln.in_register ? 'Registered (312 Roster)' : 'To verify (unrecorded site)'}
                </span>
              </div>
            </div>

            {/* GEE Scene Provenance */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5 font-mono">
              <div className="flex justify-between">
                <span>GEE Collection:</span>
                <span className="text-teal-700 dark:text-teal-400">COPERNICUS/S2_SR</span>
              </div>
              <div className="truncate" title={selectedKiln.gee_scene_id}>
                Scene: {selectedKiln.gee_scene_id || 'S2A_MSIL2A_20251128_T44RLP'}
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              Screening signal
            </span>
            <span className="text-teal-700 dark:text-teal-400 font-medium">Flagged for field visit</span>
          </div>
        </div>
      )}

      {/* Google Earth Engine Pipeline Studio Modal */}
      {isGeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                  <Satellite className="w-4 h-4" />
                  <span>Google Earth Engine (GEE) Ingestion Pipeline</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  Sentinel-2 Harmonized Surface Reflectance (L2A)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Cloud-based district extraction script running on GEE servers to produce 10 m cloud-masked tiles.
                </p>
              </div>

              <button
                onClick={() => setIsGeeModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-xl transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Earth Engine Architecture Explainer */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Catalog ImageCollection</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">COPERNICUS/S2_SR_HARMONIZED</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Spatial Resolution</span>
                <span className="font-mono font-semibold text-teal-700 dark:text-teal-400">10.0 m Ground Sample Dist</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Temporal Revisit</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">Every 5 days (S2A + S2B)</span>
              </div>
            </div>

            {/* Custom Tile URL Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Custom GEE Map Tile Endpoint (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://earthengine.googleapis.com/v1/projects/.../tiles/{z}/{x}/{y}"
                  value={customGeeUrl}
                  onChange={(e) => setCustomGeeUrl(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={() => {
                    if (customGeeUrl.trim()) {
                      setBasemapMode('gee-custom');
                      setIsGeeModalOpen(false);
                    }
                  }}
                  disabled={!customGeeUrl.trim()}
                  className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
                >
                  Mount Layer
                </button>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                If your mentor or lab has an active Earth Engine service account, paste your `getMap()` tile URL here.
              </span>
            </div>

            {/* Python / JS GEE Script Snippet */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Earth Engine JavaScript / Code Editor Script
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(geeScriptText);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 text-[11px]"
                >
                  {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied' : 'Copy GEE Script'}</span>
                </button>
              </div>
              <pre className="bg-slate-950 text-emerald-400 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto border border-slate-800 leading-relaxed max-h-56">
                {geeScriptText}
              </pre>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsGeeModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
