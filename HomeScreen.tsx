import React, { useMemo } from 'react';
import { Kiln, ScoredKiln } from '../types';
import { matchConversions } from '../utils/conversionMatching';
import { formatCoordinates } from '../utils/geo';
import { CLASS_COLORS } from './PlainLeafletMap';
import {
  Activity,
  FileQuestion,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  MapPin,
  ShieldAlert,
  Calendar,
  Compass,
  CheckCircle2,
} from 'lucide-react';

interface HomeScreenProps {
  allKilns: Kiln[];
  top20Kilns: ScoredKiln[];
  onNavigateToTab: (tabId: string) => void;
  onSelectKiln: (kiln: Kiln) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  allKilns,
  top20Kilns,
  onNavigateToTab,
  onSelectKiln,
}) => {
  // Current detections (2025-26)
  const currentKilns = useMemo(() => {
    return allKilns.filter((k) => k.period === '2025-26');
  }, [allKilns]);

  // Conversion matching data
  const conversionMatches = useMemo(() => {
    return matchConversions(allKilns);
  }, [allKilns]);

  // Key stats
  const totalDetected = currentKilns.length;
  // Honest error range with 0.80 precision and 0.85 recall
  const lowerRange = Math.round(totalDetected * 0.8);
  const upperRange = Math.round(totalDetected / 0.85);

  const unregisteredCount = currentKilns.filter((k) => !k.in_register).length;

  const stillFCBKCount = conversionMatches.filter((m) => m.status === 'Still FCBK').length;
  const unclearCount = conversionMatches.filter((m) => m.status === 'Unclear').length;
  const convertedCount = conversionMatches.filter((m) => m.status === 'Converted').length;
  const demolishedCount = conversionMatches.filter((m) => m.status === 'Demolished').length;
  const totalEvaluated = conversionMatches.length;

  const pctConverted = totalEvaluated > 0 ? (convertedCount / totalEvaluated) * 100 : 0;
  const pctStillFCBK = totalEvaluated > 0 ? (stillFCBKCount / totalEvaluated) * 100 : 0;
  const pctDemolished = totalEvaluated > 0 ? (demolishedCount / totalEvaluated) * 100 : 0;
  const pctUnclear = totalEvaluated > 0 ? (unclearCount / totalEvaluated) * 100 : 0;

  // Top 3 visit candidates
  const top3Visits = top20Kilns.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Inspector Persona & Screening Overview Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Environmental Inspection Command
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">District Sector DL-3000</span>
            </div>
            <h1 className="text-xl sm:text-[22px] font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              Screening Dashboard &amp; Prioritised Field Roster
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
              Turn Sentinel-2 satellite detections into an actionable verification schedule for Inspector Farida Khan. Prioritising 3,000 km² coverage within 1 jeep and 2 field staff capacity.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => onNavigateToTab('map')}
              className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Map</span>
            </button>
            <button
              onClick={() => onNavigateToTab('visits')}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span>Top-20 List</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Cautious Wording Notice */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <ShieldAlert className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>
            <strong className="text-slate-800 dark:text-slate-200">Protocol notice:</strong> Candidate detections are screening signals for field inspection, never legal proof of a violation.
          </span>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Detected Kilns with Error Range */}
        <div
          onClick={() => onNavigateToTab('counts')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 rounded-2xl p-5 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Detected Kilns (2025-26)</span>
            <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-2">
            {totalDetected}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>Honest Range:</span>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {lowerRange} &ndash; {upperRange}
            </span>
          </div>
        </div>

        {/* Card 2: Not in Register ("To verify") */}
        <div
          onClick={() => onNavigateToTab('counts')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 rounded-2xl p-5 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Not in Register</span>
            <FileQuestion className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-2">
            {unregisteredCount}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>Official Register: 312</span>
            <span className="text-amber-700 dark:text-amber-400 font-semibold text-[11px] uppercase">
              To verify
            </span>
          </div>
        </div>

        {/* Card 3: Still FCBK */}
        <div
          onClick={() => onNavigateToTab('convert')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 rounded-2xl p-5 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Still FCBK</span>
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2">
            {stillFCBKCount}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>Conversion Status:</span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {pctStillFCBK.toFixed(0)}% of baseline
            </span>
          </div>
        </div>

        {/* Card 4: Unclear */}
        <div
          onClick={() => onNavigateToTab('convert')}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 rounded-2xl p-5 shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Unclear Status</span>
            <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-2">
            {unclearCount}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>Rule:</span>
            <span className="text-slate-700 dark:text-slate-300">Conf &lt; 0.50 stays unclear</span>
          </div>
        </div>
      </div>

      {/* Mini Stacked Bar for Conversion Status */}
      <div
        onClick={() => onNavigateToTab('convert')}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              District Conversion Status Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              100 m spatial matching from 2023-24 baseline to current 2025-26 imagery ({totalEvaluated} baseline FCBKs)
            </p>
          </div>
          <div className="text-xs font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-1 self-start sm:self-auto">
            <span>View detailed matching ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Stacked bar */}
        <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${pctConverted}%` }}
            className="bg-emerald-600 transition-all duration-300"
            title={`Converted: ${convertedCount} (${pctConverted.toFixed(1)}%)`}
          />
          <div
            style={{ width: `${pctStillFCBK}%` }}
            className="bg-rose-600 transition-all duration-300"
            title={`Still FCBK: ${stillFCBKCount} (${pctStillFCBK.toFixed(1)}%)`}
          />
          <div
            style={{ width: `${pctDemolished}%` }}
            className="bg-slate-400 dark:bg-slate-600 transition-all duration-300"
            title={`Demolished: ${demolishedCount} (${pctDemolished.toFixed(1)}%)`}
          />
          <div
            style={{ width: `${pctUnclear}%` }}
            className="bg-amber-500 transition-all duration-300"
            title={`Unclear: ${unclearCount} (${pctUnclear.toFixed(1)}%)`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Converted: </span>
              <span className="font-mono text-slate-600 dark:text-slate-400">{convertedCount} ({pctConverted.toFixed(0)}%)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Still FCBK: </span>
              <span className="font-mono text-slate-600 dark:text-slate-400">{stillFCBKCount} ({pctStillFCBK.toFixed(0)}%)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Demolished: </span>
              <span className="font-mono text-slate-600 dark:text-slate-400">{demolishedCount} ({pctDemolished.toFixed(0)}%)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Unclear: </span>
              <span className="font-mono text-slate-600 dark:text-slate-400">{unclearCount} ({pctUnclear.toFixed(0)}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* "Start with these 3 visits" Preview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Start with these 3 priority visits
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Highest scoring screening candidates based on new appearance, proximity, and uncertainty
            </p>
          </div>

          <button
            onClick={() => onNavigateToTab('visits')}
            className="text-xs font-semibold text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View all 20 ranked sites</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {top3Visits.map((kiln) => {
            const color = CLASS_COLORS[kiln.class] || CLASS_COLORS.FCBK;
            return (
              <div
                key={kiln.id}
                onClick={() => onSelectKiln(kiln)}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800/80 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-mono font-bold flex items-center justify-center">
                        #{kiln.rank}
                      </span>
                      <span className="font-mono font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {kiln.id}
                      </span>
                    </div>

                    <span className="font-mono font-bold text-xs text-teal-700 dark:text-teal-400">
                      {kiln.priorityScore} pts
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-2.5">
                    <span
                      className="inline-flex items-center gap-1 text-xs font-semibold"
                      style={{ color: color.hex }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color.hex }} />
                      {kiln.class}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {(kiln.confidence * 100).toFixed(0)}% conf
                    </span>
                    {!kiln.in_register && (
                      <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                        Unregistered
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                    {kiln.oneLineReason}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[170px]" title={`${kiln.village}, Tehsil ${kiln.tehsil}`}>
                    {kiln.village ? `${kiln.village}, ${kiln.tehsil}` : formatCoordinates(kiln.lat, kiln.lon)}
                  </span>
                  <span className="font-medium text-teal-700 dark:text-teal-400 shrink-0">Locate &rarr;</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
