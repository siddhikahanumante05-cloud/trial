import React, { useState, useMemo } from 'react';
import { Kiln, ConversionMatch, ConversionStatus } from '../types';
import { matchConversions } from '../utils/conversionMatching';
import { formatCoordinates } from '../utils/geo';
import { Info, Search, CheckCircle2, AlertTriangle, HelpCircle, Ban, ArrowUpRight } from 'lucide-react';

interface ConversionScreenProps {
  allKilns: Kiln[];
  onSelectKiln?: (kiln: Kiln) => void;
}

export const ConversionScreen: React.FC<ConversionScreenProps> = ({ allKilns, onSelectKiln }) => {
  const [filterStatus, setFilterStatus] = useState<ConversionStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const matches = useMemo(() => {
    return matchConversions(allKilns);
  }, [allKilns]);

  const stats = useMemo(() => {
    const total = matches.length;
    const converted = matches.filter((m) => m.status === 'Converted').length;
    const stillFCBK = matches.filter((m) => m.status === 'Still FCBK').length;
    const demolished = matches.filter((m) => m.status === 'Demolished').length;
    const unclear = matches.filter((m) => m.status === 'Unclear').length;

    return {
      total,
      converted,
      stillFCBK,
      demolished,
      unclear,
      pctConverted: total > 0 ? (converted / total) * 100 : 0,
      pctStillFCBK: total > 0 ? (stillFCBK / total) * 100 : 0,
      pctDemolished: total > 0 ? (demolished / total) * 100 : 0,
      pctUnclear: total > 0 ? (unclear / total) * 100 : 0,
    };
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (filterStatus !== 'ALL' && m.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.id_2023.toLowerCase().includes(q) ||
          m.reason.toLowerCase().includes(q) ||
          (m.match_2025 && m.match_2025.id.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [matches, filterStatus, searchQuery]);

  const statusBadges: Record<ConversionStatus, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    Converted: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    },
    'Still FCBK': {
      bg: 'bg-rose-50 dark:bg-rose-950/50',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      icon: <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />,
    },
    Demolished: {
      bg: 'bg-slate-100 dark:bg-slate-800/60',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
      icon: <Ban className="w-3 h-3 text-slate-500 shrink-0" />,
    },
    Unclear: {
      bg: 'bg-amber-50 dark:bg-amber-950/50',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      icon: <HelpCircle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />,
    },
  };

  return (
    <div className="space-y-6">
      {/* Overview and Stacked Bar Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Temporal Conversion Tracker
            </div>
            <h1 className="text-xl sm:text-[22px] font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
              Did It Convert? 100 m Spatial Matching
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Matching 2023-24 baseline FCBK kilns against 2025-26 satellite detections within a 100 m radius.
            </p>
          </div>
          <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold self-start md:self-auto">
            {stats.total} baseline FCBKs evaluated
          </div>
        </div>

        {/* Stacked Proportional Bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            <span>District Status Distribution</span>
            <span className="font-mono text-slate-500 dark:text-slate-400">100 m spatial radius window</span>
          </div>

          <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${stats.pctConverted}%` }}
              className="bg-emerald-600 transition-all duration-300"
              title={`Converted: ${stats.converted} (${stats.pctConverted.toFixed(1)}%)`}
            />
            <div
              style={{ width: `${stats.pctStillFCBK}%` }}
              className="bg-rose-600 transition-all duration-300"
              title={`Still FCBK: ${stats.stillFCBK} (${stats.pctStillFCBK.toFixed(1)}%)`}
            />
            <div
              style={{ width: `${stats.pctDemolished}%` }}
              className="bg-slate-400 dark:bg-slate-600 transition-all duration-300"
              title={`Demolished: ${stats.demolished} (${stats.pctDemolished.toFixed(1)}%)`}
            />
            <div
              style={{ width: `${stats.pctUnclear}%` }}
              className="bg-amber-500 transition-all duration-300"
              title={`Unclear: ${stats.unclear} (${stats.pctUnclear.toFixed(1)}%)`}
            />
          </div>

          {/* Stacked Bar Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">Converted</div>
                <div className="font-mono text-slate-500 dark:text-slate-400">
                  {stats.converted} ({stats.pctConverted.toFixed(0)}%)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">Still FCBK</div>
                <div className="font-mono text-slate-500 dark:text-slate-400">
                  {stats.stillFCBK} ({stats.pctStillFCBK.toFixed(0)}%)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0" />
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">Demolished</div>
                <div className="font-mono text-slate-500 dark:text-slate-400">
                  {stats.demolished} ({stats.pctDemolished.toFixed(0)}%)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">Unclear</div>
                <div className="font-mono text-slate-500 dark:text-slate-400">
                  {stats.unclear} ({stats.pctUnclear.toFixed(0)}%)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Small Info Callout: Low confidence stays Unclear */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-start sm:items-center gap-2 text-xs text-amber-900 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200/80 dark:border-amber-800/80">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span>
              <strong>Calibration protocol:</strong> Low confidence stays Unclear. Matches with confidence &lt; 0.50 are never reported as converted.
            </span>
            <span className="text-amber-700 dark:text-amber-400 text-[11px] whitespace-nowrap">
              Prevents inflated conversion reporting
            </span>
          </div>
        </div>
      </div>

      {/* Segmented Control & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Control */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['ALL', 'Converted', 'Still FCBK', 'Demolished', 'Unclear'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filterStatus === st
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All records' : st}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Matches Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/70 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Baseline ID (2023-24)</th>
                <th className="py-2.5 px-3">Coordinates</th>
                <th className="py-2.5 px-3">2025 Match Details</th>
                <th className="py-2.5 px-3">Status Verdict</th>
                <th className="py-2.5 px-3">Explainable Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMatches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    No conversion records match the selected status or query.
                  </td>
                </tr>
              ) : (
                filteredMatches.map((m) => {
                  const badge = statusBadges[m.status];
                  return (
                    <tr
                      key={m.id_2023}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => onSelectKiln && onSelectKiln(m.match_2025 || m.kiln_2023)}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {m.id_2023}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatCoordinates(m.kiln_2023.lat, m.kiln_2023.lon)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {m.match_2025 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{m.match_2025.class}</span>
                            <span className="text-slate-300 dark:text-slate-700">|</span>
                            <span className="font-mono text-slate-600 dark:text-slate-400">
                              {(m.match_2025.confidence * 100).toFixed(0)}% conf
                            </span>
                            {m.distance_m !== undefined && (
                              <span className="text-[11px] text-slate-400">
                                ({m.distance_m.toFixed(0)}m)
                              </span>
                            )}
                          </div>
                        ) : m.candidate_matches && m.candidate_matches.length > 1 ? (
                          <span className="text-amber-700 dark:text-amber-400 font-medium">
                            {m.candidate_matches.length} candidates nearby
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No candidate &le; 100 m</span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.icon}
                          <span>{m.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-md">
                        {m.reason}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
