import React, { useState } from 'react';
import { ScoredKiln, Kiln } from '../types';
import { formatCoordinates } from '../utils/geo';
import { CLASS_COLORS } from './PlainLeafletMap';
import {
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  Download,
  ShieldAlert,
  ArrowRight,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface VisitListScreenProps {
  top20Kilns: ScoredKiln[];
  onSelectKiln: (kiln: Kiln) => void;
  onNavigateToTab: (tabId: string) => void;
}

export const VisitListScreen: React.FC<VisitListScreenProps> = ({
  top20Kilns,
  onSelectKiln,
  onNavigateToTab,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header and Prioritisation Rationale */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Inspector Farida Khan &middot; Resource-Constrained Prioritisation
            </div>
            <h1 className="text-xl sm:text-[22px] font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
              Top-20 Field Verification Priority Roster
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Screening candidates ranked to maximize inspection value across 3,000 km&sup2; with 1 jeep and 2 field staff.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => onNavigateToTab('plan')}
              className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>View 1-Day Plan</span>
            </button>
            <button
              onClick={() => onNavigateToTab('export')}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Scoring Methodology Breakdown Strip */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="font-bold text-slate-900 dark:text-slate-100">+40 pts: </span>
            <span>New since 2023-24 &amp; still FCBK</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="font-bold text-slate-900 dark:text-slate-100">+5/nb (max 25): </span>
            <span>Within 1 km of other kilns</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="font-bold text-slate-900 dark:text-slate-100">+20 pts: </span>
            <span>Model uncertain (0.4&ndash;0.7)</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <span className="font-bold text-slate-900 dark:text-slate-100">+15 pts: </span>
            <span>Claimed conversion but FCBK</span>
          </div>
        </div>

        {/* Mandatory Protocol Captions */}
        <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-medium text-teal-800 dark:text-teal-300">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-teal-600 dark:text-teal-400" />
            <span>A flag means check this site, not proof of a violation.</span>
          </div>
          <div className="flex items-center gap-1.5 pl-5 text-[11px] text-slate-500 dark:text-slate-400 italic">
            <span>The 1 km neighbour flag is only a reason to check, never evidence of wrongdoing.</span>
          </div>
        </div>
      </div>

      {/* Ranked Cards List */}
      <div className="space-y-3">
        {top20Kilns.map((kiln) => {
          const isExpanded = expandedId === kiln.id;
          const color = CLASS_COLORS[kiln.class] || CLASS_COLORS.FCBK;

          return (
            <div
              key={kiln.id}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-sm transition-all ${
                isExpanded
                  ? 'border-teal-500 dark:border-teal-500 ring-1 ring-teal-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left: Rank badge, ID, Class chip, Reason */}
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold font-mono text-xs flex items-center justify-center shrink-0">
                    #{kiln.rank}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {kiln.id}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">&middot;</span>
                      {/* Class chip */}
                      <span
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                        style={{ color: color.hex }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color.hex }} />
                        {kiln.class}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">&middot;</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {(kiln.confidence * 100).toFixed(0)}% conf
                      </span>
                      {!kiln.in_register && (
                        <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold px-2 py-0.2 rounded-full uppercase">
                          Unregistered
                        </span>
                      )}
                    </div>

                    {/* Explanatory one-line reason */}
                    <div className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">
                      {kiln.oneLineReason}
                    </div>

                    {/* Realistic District Location Pill */}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {kiln.village ? `${kiln.village}, Tehsil ${kiln.tehsil}` : 'Mohanlalganj Sector'}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">&middot;</span>
                      <span className="text-slate-500 dark:text-slate-400 truncate max-w-xs">
                        {kiln.road_access || 'Kutcha jeep track accessible'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Score Pill & Action Buttons */}
                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                      Priority Score
                    </div>
                    <div className="text-lg font-bold font-mono text-teal-700 dark:text-teal-400">
                      {kiln.priorityScore} <span className="text-xs font-normal text-slate-400">pts</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectKiln(kiln)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    title="Locate on Map"
                    aria-label="Locate kiln on map"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>

                  {/* "Why this rank" Expandable Trigger */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : kiln.id)}
                    className="min-h-[44px] px-3 flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-xs font-medium"
                    aria-expanded={isExpanded}
                  >
                    <span>Why this rank</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expandable score factor breakdown */}
              {isExpanded && (
                <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 animate-in fade-in duration-150">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>Score Factor Ledger</span>
                    </div>
                    <ul className="space-y-1.5">
                      {kiln.factors.map((f, fIdx) => (
                        <li key={fIdx} className="flex justify-between text-slate-600 dark:text-slate-300">
                          <span>{f.label}</span>
                          <span className="font-mono font-bold text-teal-700 dark:text-teal-400">+{f.points}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5 text-slate-500 dark:text-slate-400 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 sm:pl-3.5 pt-2.5 sm:pt-0 text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Location: </span>
                      <span>Village {kiln.village || 'Kalyanpur'}, Tehsil {kiln.tehsil || 'Mohanlalganj'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Coordinates: </span>
                      <span className="font-mono">{formatCoordinates(kiln.lat, kiln.lon)}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Jeep Access: </span>
                      <span>{kiln.road_access || 'Rural track accessible'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Soil Type: </span>
                      <span>{kiln.soil_type || 'Deep alluvial clay loam'}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">GEE Sentinel-2 Scene: </span>
                      <span className="font-mono text-[10px] text-teal-700 dark:text-teal-400">{kiln.gee_scene_id || 'COPERNICUS/S2_SR'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
