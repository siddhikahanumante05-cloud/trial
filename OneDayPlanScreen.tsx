import React, { useState, useMemo } from 'react';
import { ScoredKiln, KilnCluster, Kiln } from '../types';
import { clusterTopKilns } from '../utils/clustering';
import { PlainLeafletMap, CLASS_COLORS } from './PlainLeafletMap';
import { formatCoordinates, haversineDistanceMeters } from '../utils/geo';
import { AlertTriangle, Calendar, Printer, MapPin, Compass, ArrowRight, CheckCircle2 } from 'lucide-react';

interface OneDayPlanScreenProps {
  top20Kilns: ScoredKiln[];
  allKilns: Kiln[];
  onSelectKiln: (kiln: Kiln | null) => void;
  onNavigateToTab: (tabId: string) => void;
  isDark?: boolean;
}

export const OneDayPlanScreen: React.FC<OneDayPlanScreenProps> = ({
  top20Kilns,
  allKilns,
  onSelectKiln,
  onNavigateToTab,
  isDark = false,
}) => {
  const clusters = useMemo(() => {
    return clusterTopKilns(top20Kilns, 3);
  }, [top20Kilns]);

  const [activeClusterId, setActiveClusterId] = useState<number | null>(
    clusters[0]?.id || null
  );

  const selectedCluster = clusters.find((c) => c.id === activeClusterId) || clusters[0];

  const tourDistanceKm = useMemo(() => {
    if (!selectedCluster || selectedCluster.kilns.length < 2) return 0;
    let distMeters = 0;
    for (let i = 0; i < selectedCluster.kilns.length - 1; i++) {
      distMeters += haversineDistanceMeters(
        selectedCluster.kilns[i].lat,
        selectedCluster.kilns[i].lon,
        selectedCluster.kilns[i + 1].lat,
        selectedCluster.kilns[i + 1].lon
      );
    }
    return distMeters / 1000;
  }, [selectedCluster]);

  return (
    <div className="space-y-6">
      {/* Header and Constraint Brief */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Single-Day Inspection Deployment
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold px-2 py-0.5 rounded-full">
                1 Jeep &middot; 2 Staff
              </span>
            </div>
            <h1 className="text-xl sm:text-[22px] font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
              Top-20 Spatial Patrol Clusters
            </h1>
          </div>

          {/* Mandatory Label Highlight */}
          <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 self-start md:self-auto shadow-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Straight-line clusters, NOT road routing.</span>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-3xl">
          Given the 3,000 km&sup2; territory, the Top-20 candidate targets are partitioned into 3 compact sectors (about 5&ndash;7 sites each) so Inspector Farida Khan can complete one focused patrol loop per field day without criss-crossing the district.
        </p>

        {/* Cluster / Day Selector Tabs */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveClusterId(null)}
            className={`min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors ${
              activeClusterId === null
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Clusters Overview
          </button>
          {clusters.map((cl, idx) => (
            <button
              key={cl.id}
              onClick={() => setActiveClusterId(cl.id)}
              className={`min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors flex items-center gap-2 ${
                activeClusterId === cl.id
                  ? 'bg-teal-700 dark:bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Day {idx + 1}: {cl.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeClusterId === cl.id ? 'bg-teal-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {cl.kilns.length} sites
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Map with dashed region ellipses */}
      <div>
        <PlainLeafletMap
          kilns={activeClusterId === null ? top20Kilns : (selectedCluster?.kilns || top20Kilns)}
          top20Kilns={top20Kilns}
          clusters={clusters}
          showClusters={true}
          activeClusterId={activeClusterId}
          selectedKiln={null}
          onSelectKiln={onSelectKiln}
          heightClass="h-[460px] md:h-[520px]"
          isDark={isDark}
        />
      </div>

      {/* Stepper List Below */}
      {selectedCluster && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {selectedCluster.name} &mdash; Sequential Field Stepper
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{selectedCluster.kilns.length} candidate sites</span>
                <span>&middot;</span>
                <span>Est. Straight-Line Span: <strong className="font-mono text-slate-800 dark:text-slate-200">{tourDistanceKm.toFixed(1)} km</strong></span>
                <span>&middot;</span>
                <span>Sector Radius: ~{(selectedCluster.semiMajorM / 1000).toFixed(1)} km</span>
              </div>
            </div>

            <button
              onClick={() => onNavigateToTab('export')}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Patrol Brief</span>
            </button>
          </div>

          {/* Stepper Steps */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
            {selectedCluster.kilns.map((kiln, idx) => {
              const prevKiln = idx > 0 ? selectedCluster.kilns[idx - 1] : null;
              const legDistMeters = prevKiln
                ? haversineDistanceMeters(prevKiln.lat, prevKiln.lon, kiln.lat, kiln.lon)
                : 0;
              const color = CLASS_COLORS[kiln.class] || CLASS_COLORS.FCBK;

              return (
                <div
                  key={kiln.id}
                  className="relative group cursor-pointer"
                  onClick={() => onSelectKiln(kiln)}
                >
                  {/* Step Dot */}
                  <div className="absolute -left-6 top-1.5 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-2 border-teal-600 dark:border-teal-400 text-slate-900 dark:text-slate-100 font-bold font-mono text-[11px] flex items-center justify-center shadow-sm">
                    {idx + 1}
                  </div>

                  <div className="ml-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold font-mono flex items-center justify-center shrink-0">
                          #{kiln.rank}
                        </span>
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                          {kiln.id}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">&middot;</span>
                        <span className="font-semibold text-xs" style={{ color: color.hex }}>
                          {kiln.class} ({(kiln.confidence * 100).toFixed(0)}%)
                        </span>
                        {!kiln.in_register && (
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800 uppercase">
                            Unregistered
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {idx === 0 ? 'Start Site' : `+${(legDistMeters / 1000).toFixed(1)} km straight-line`}
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-slate-700 dark:text-slate-300">
                      {kiln.oneLineReason}
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 truncate max-w-sm">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {kiln.village ? `${kiln.village}, Tehsil ${kiln.tehsil}` : 'Mohanlalganj'}
                        </span>
                        <span>&middot;</span>
                        <span className="font-mono text-[10px]">{formatCoordinates(kiln.lat, kiln.lon)}</span>
                      </div>
                      <span className="text-teal-700 dark:text-teal-400 font-medium shrink-0">Locate on map &rarr;</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
