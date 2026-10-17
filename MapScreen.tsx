import React, { useState, useMemo } from 'react';
import { Kiln, ScoredKiln } from '../types';
import { PlainLeafletMap } from './PlainLeafletMap';
import { SlidersHorizontal, ChevronDown, ChevronUp, Check, Layers } from 'lucide-react';

interface MapScreenProps {
  allKilns: Kiln[];
  top20Kilns: ScoredKiln[];
  selectedKiln: Kiln | null;
  onSelectKiln: (kiln: Kiln | null) => void;
  isDark?: boolean;
}

export const MapScreen: React.FC<MapScreenProps> = ({
  allKilns,
  top20Kilns,
  selectedKiln,
  onSelectKiln,
  isDark = false,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('ALL');
  const [selectedRegister, setSelectedRegister] = useState<string>('ALL');
  const [showTop20Only, setShowTop20Only] = useState<boolean>(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(true);

  // Filter kilns according to active filters
  const filteredKilns = useMemo(() => {
    return allKilns.filter((k) => {
      if (selectedClass !== 'ALL' && k.class !== selectedClass) return false;
      if (selectedPeriod !== 'ALL' && k.period !== selectedPeriod) return false;
      if (selectedRegister === 'REGISTERED' && !k.in_register) return false;
      if (selectedRegister === 'UNREGISTERED' && k.in_register) return false;
      if (showTop20Only && !top20Kilns.some((t) => t.id === k.id)) return false;
      return true;
    });
  }, [allKilns, top20Kilns, selectedClass, selectedPeriod, selectedRegister, showTop20Only]);

  const activeFiltersCount =
    (selectedClass !== 'ALL' ? 1 : 0) +
    (selectedPeriod !== 'ALL' ? 1 : 0) +
    (selectedRegister !== 'ALL' ? 1 : 0) +
    (showTop20Only ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Top Map Toolbar & Collapsible Filter Drawer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Spatial Geographic Screening
            </div>
            <h1 className="text-xl sm:text-[22px] font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
              District Map &amp; Candidate Coordinates
            </h1>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
              <span>Showing <strong className="font-mono text-slate-800 dark:text-slate-200">{filteredKilns.length}</strong> of {allKilns.length} candidate detections</span>
              <span>&middot;</span>
              <span>3,000 km&sup2; Sector</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Top-20 Toggle */}
            <button
              onClick={() => setShowTop20Only(!showTop20Only)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                showTop20Only
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Top-20 Priorities</span>
              {showTop20Only && (
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 dark:bg-teal-600"></span>
              )}
            </button>

            {/* Filter Drawer Toggle */}
            <button
              onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-teal-700 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
              {isFilterDrawerOpen ? (
                <ChevronUp className="w-3.5 h-3.5 ml-0.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Filter Drawer Body */}
        {isFilterDrawerOpen && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-150">
            {/* Class Filter */}
            <div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Kiln Design Class
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {(['ALL', 'FCBK', 'CFCBK', 'Zigzag'] as const).map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setSelectedClass(cls)}
                    className={`flex-1 py-1 text-xs font-medium rounded-lg transition-colors ${
                      selectedClass === cls
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {cls === 'ALL' ? 'All' : cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Period Filter */}
            <div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Detection Period
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {(['ALL', '2023-24', '2025-26'] as const).map((prd) => (
                  <button
                    key={prd}
                    onClick={() => setSelectedPeriod(prd)}
                    className={`flex-1 py-1 text-xs font-medium rounded-lg transition-colors ${
                      selectedPeriod === prd
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {prd === 'ALL' ? 'Both' : prd}
                  </button>
                ))}
              </div>
            </div>

            {/* Register Status Filter */}
            <div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Official Register Status
              </div>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'REGISTERED', label: 'Registered' },
                  { id: 'UNREGISTERED', label: 'To verify' },
                ].map((reg) => (
                  <button
                    key={reg.id}
                    onClick={() => setSelectedRegister(reg.id)}
                    className={`flex-1 py-1 text-xs font-medium rounded-lg transition-colors ${
                      selectedRegister === reg.id
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {reg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Map with plain lat/lon grid */}
      <PlainLeafletMap
        kilns={filteredKilns}
        top20Kilns={top20Kilns}
        selectedKiln={selectedKiln}
        onSelectKiln={onSelectKiln}
        heightClass="h-[520px] md:h-[620px]"
        isDark={isDark}
      />
    </div>
  );
};
