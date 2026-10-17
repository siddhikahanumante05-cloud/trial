import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Kiln, KilnClass } from '../types';
import { generateTileImageDataUrl } from '../utils/sampleTiles';
import { CLASS_COLORS } from './PlainLeafletMap';
import { Upload, RotateCcw, Sliders, Info, ShieldAlert, Check } from 'lucide-react';

interface DetectScreenProps {
  allKilns: Kiln[];
}

interface HoveredBox {
  kiln: Kiln;
  x: number;
  y: number;
}

export const DetectScreen: React.FC<DetectScreenProps> = ({ allKilns }) => {
  const availableTileIds = useMemo(() => {
    const set = new Set<string>();
    allKilns.forEach((k) => set.add(k.tile_id));
    return Array.from(set).sort();
  }, [allKilns]);

  const [selectedTileId, setSelectedTileId] = useState<string>(
    availableTileIds[0] || 'tile_042'
  );
  const [minConfidence, setMinConfidence] = useState<number>(0.5);
  const [customImageSrc, setCustomImageSrc] = useState<string | null>(null);
  const [customImageName, setCustomImageName] = useState<string>('');
  const [selectedKilnId, setSelectedKilnId] = useState<string | null>(null);
  const [hoveredBox, setHoveredBox] = useState<HoveredBox | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Filter detections for this tile_id and min confidence
  const tileDetections = useMemo(() => {
    return allKilns.filter(
      (k) => k.tile_id === selectedTileId && k.confidence >= minConfidence
    );
  }, [allKilns, selectedTileId, minConfidence]);

  // Counts by class in current tile view
  const classCounts = useMemo(() => {
    const counts: Record<KilnClass, number> = { FCBK: 0, CFCBK: 0, Zigzag: 0 };
    tileDetections.forEach((k) => {
      counts[k.class] = (counts[k.class] || 0) + 1;
    });
    return counts;
  }, [tileDetections]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setCustomImageSrc(src);
      setCustomImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  // Pre-calculated position coordinates for synthetic boxes
  const posMap: Record<string, { x: number; y: number }> = {
    'KLN-2023-001': { x: 75, y: 95 },
    'KLN-2025-001': { x: 78, y: 98 },
    'KLN-2023-002': { x: 165, y: 140 },
    'KLN-2025-002': { x: 168, y: 142 },
    'KLN-2025-003': { x: 210, y: 80 },
    'KLN-2025-004': { x: 140, y: 190 },
    'KLN-2025-006': { x: 195, y: 205 },
    'KLN-2023-010': { x: 80, y: 85 },
    'KLN-2025-010': { x: 83, y: 88 },
    'KLN-2023-011': { x: 150, y: 95 },
    'KLN-2025-011': { x: 153, y: 98 },
    'KLN-2025-013': { x: 130, y: 180 },
    'KLN-2025-014': { x: 175, y: 160 },
    'KLN-2025-016': { x: 190, y: 170 },
    'KLN-2023-020': { x: 90, y: 110 },
    'KLN-2025-020': { x: 92, y: 112 },
    'KLN-2023-021': { x: 170, y: 120 },
    'KLN-2025-021': { x: 172, y: 122 },
    'KLN-2025-023': { x: 140, y: 190 },
  };

  const getKilnCoords = (k: Kiln, w: number, h: number, idx: number) => {
    if (posMap[k.id]) {
      return {
        cx: (posMap[k.id].x / 256) * w,
        cy: (posMap[k.id].y / 256) * h,
      };
    }
    const hash = k.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return {
      cx: (((hash * 47) % 180) + 38) * (w / 256),
      cy: ((((hash + idx) * 31) % 180) + 38) * (h / 256),
    };
  };

  // Render tile and rotated bounding boxes onto canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = customImageSrc || generateTileImageDataUrl(selectedTileId);

    img.onload = () => {
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      // Subtle 10m grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw oriented bounding boxes
      tileDetections.forEach((k, idx) => {
        const { cx, cy } = getKilnCoords(k, w, h, idx);
        const scalePx = w / 256;
        const boxWidth = (k.height_m * 0.75) * scalePx;
        const boxHeight = (k.width_m * 0.75) * scalePx;
        const angleRad = (k.angle_deg * Math.PI) / 180;
        const color = CLASS_COLORS[k.class]?.hex || '#f43f5e';
        const isSelected = selectedKilnId === k.id;
        const isHovered = hoveredBox?.kiln.id === k.id;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angleRad);

        ctx.strokeStyle = color;
        ctx.lineWidth = isSelected || isHovered ? 3.5 : 2;
        ctx.fillStyle = isSelected || isHovered ? `${color}40` : `${color}1f`;
        ctx.beginPath();
        if (k.class === 'CFCBK') {
          ctx.rect(-boxWidth / 2, -boxWidth / 2, boxWidth, boxWidth);
        } else {
          ctx.rect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);
        }
        ctx.fill();
        ctx.stroke();

        // Orientation / heading line
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(boxWidth / 2 + 8, 0);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();

        // Label tag
        const labelText = `${k.class} ${(k.confidence * 100).toFixed(0)}%`;
        ctx.font = 'bold 11px "Inter", sans-serif';
        const textMetrics = ctx.measureText(labelText);
        const badgeW = textMetrics.width + 10;
        const badgeH = 18;
        const badgeX = cx - badgeW / 2;
        const badgeY = cy - boxHeight / 2 - 16;

        ctx.fillStyle = color;
        ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, badgeX + 5, badgeY + badgeH - 5);
      });
    };
  }, [selectedTileId, customImageSrc, tileDetections, selectedKilnId, hoveredBox]);

  // Handle canvas mouse move for interactive tooltips
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Check hit test on detections
    let found: HoveredBox | null = null;
    for (let idx = 0; idx < tileDetections.length; idx++) {
      const k = tileDetections[idx];
      const { cx, cy } = getKilnCoords(k, canvas.width, canvas.height, idx);
      const dist = Math.hypot(mouseX - cx, mouseY - cy);
      if (dist < 40) {
        found = {
          kiln: k,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        break;
      }
    }
    setHoveredBox(found);
  };

  const handleCanvasMouseLeave = () => {
    setHoveredBox(null);
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Detector Inference Inspection
            </div>
            <h1 className="text-xl sm:text-[22px] font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
              Oriented Bounding Box Viewer
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Framed Sentinel-2 10 m RGB satellite crops with rotated bounding boxes, confidence filtering, and hover tooltips.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-xl shadow-sm transition-colors shrink-0">
              <Upload className="w-4 h-4" />
              <span>Upload Tile</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            {customImageSrc && (
              <button
                onClick={() => {
                  setCustomImageSrc(null);
                  setCustomImageName('');
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1.5"
                title="Revert to bundled satellite tile"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Controls row */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tile Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Tile ID
            </label>
            <select
              value={selectedTileId}
              onChange={(e) => setSelectedTileId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {availableTileIds.map((tid) => (
                <option key={tid} value={tid}>
                  {tid} ({allKilns.filter((k) => k.tile_id === tid).length} kilns)
                </option>
              ))}
            </select>
          </div>

          {/* Confidence Slider with Live Readout */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">Confidence Threshold</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Visible detections: <strong className="font-mono text-slate-900 dark:text-slate-100">{tileDetections.length}</strong>
                </span>
                <span className="font-mono font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-md">
                  &ge; {(minConfidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <input
              type="range"
              min="0.30"
              max="0.95"
              step="0.05"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-700 dark:accent-teal-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              <span>0.30 (Screening low)</span>
              <span>0.50 (Standard protocol cutoff)</span>
              <span>0.95 (High confidence only)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace: Framed Viewer + Detections List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Framed Tile Viewer */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {customImageName ? `Custom Tile: ${customImageName}` : `Sentinel-2 Crop: ${selectedTileId}`}
            </span>
            <span>256 &times; 256 px (10 m/pixel)</span>
          </div>

          <div
            ref={containerRef}
            className="relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner bg-slate-900 flex items-center justify-center max-w-full"
          >
            <canvas
              ref={canvasRef}
              width={512}
              height={512}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave}
              onClick={() => {
                if (hoveredBox) {
                  setSelectedKilnId(hoveredBox.kiln.id);
                }
              }}
              className="w-full max-w-[460px] h-auto aspect-square object-contain cursor-crosshair"
            />

            {/* Interactive Tooltip on Box Hover */}
            {hoveredBox && (
              <div
                style={{
                  left: `${hoveredBox.x}px`,
                  top: `${Math.max(10, hoveredBox.y - 70)}px`,
                  transform: 'translate(-50%, -100%)',
                }}
                className="absolute z-30 pointer-events-none bg-slate-950/95 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs shadow-xl min-w-[180px] animate-in fade-in duration-100"
              >
                <div className="font-mono font-bold text-teal-400 flex items-center justify-between">
                  <span>{hoveredBox.kiln.id}</span>
                  <span className="text-[10px] text-slate-300">{(hoveredBox.kiln.confidence * 100).toFixed(0)}% conf</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-300 space-y-0.5">
                  <div>Class: <strong className="text-white">{hoveredBox.kiln.class}</strong></div>
                  <div>Size: <span className="font-mono">{hoveredBox.kiln.width_m}&times;{hoveredBox.kiln.height_m}m @ {hoveredBox.kiln.angle_deg}&deg;</span></div>
                  <div>Register: <span className={hoveredBox.kiln.in_register ? 'text-emerald-400' : 'text-amber-400'}>{hoveredBox.kiln.in_register ? 'Recorded' : 'To verify'}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Class Legend */}
          <div className="w-full mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500"></span>
              <span className="font-medium text-slate-800 dark:text-slate-200">FCBK ({classCounts.FCBK})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-purple-600"></span>
              <span className="font-medium text-slate-800 dark:text-slate-200">CFCBK ({classCounts.CFCBK})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-teal-600"></span>
              <span className="font-medium text-slate-800 dark:text-slate-200">Zigzag ({classCounts.Zigzag})</span>
            </div>
          </div>
        </div>

        {/* Live Inferences List */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Tile Detections ({tileDetections.length})
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              &ge; {(minConfidence * 100).toFixed(0)}% conf
            </span>
          </div>

          {tileDetections.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
              <Info className="w-6 h-6 text-slate-400 mb-2" />
              <p>No detections meet the {(minConfidence * 100).toFixed(0)}% confidence threshold.</p>
              <button
                onClick={() => setMinConfidence(0.4)}
                className="mt-2 text-teal-700 dark:text-teal-400 font-semibold underline"
              >
                Lower threshold to 40%
              </button>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-[460px] pr-1">
              {tileDetections.map((k) => {
                const isSelected = selectedKilnId === k.id;
                const colorHex = CLASS_COLORS[k.class]?.hex || '#f43f5e';
                return (
                  <div
                    key={k.id}
                    onClick={() => setSelectedKilnId(isSelected ? null : k.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-600 dark:border-teal-400 bg-teal-50/50 dark:bg-teal-950/40 ring-1 ring-teal-600 dark:ring-teal-400'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: colorHex }}
                        />
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{k.id}</span>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{k.class}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                        {(k.confidence * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <div>
                        <span>Angle: </span>
                        <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{k.angle_deg}&deg;</span>
                      </div>
                      <div>
                        <span>Size: </span>
                        <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{k.width_m}&times;{k.height_m}m</span>
                      </div>
                      <div>
                        <span>Period: </span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{k.period}</span>
                      </div>
                      <div>
                        <span>Register: </span>
                        <span className={k.in_register ? 'text-slate-700 dark:text-slate-300' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
                          {k.in_register ? 'Registered' : 'To verify'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
