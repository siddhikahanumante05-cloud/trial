import React, { useState } from 'react';
import { Kiln, ModelMetrics } from '../types';
import { Sliders, RotateCcw, Info, ShieldCheck, FileCheck, Layers } from 'lucide-react';

interface CountsScreenProps {
  allKilns: Kiln[];
  modelMetrics: ModelMetrics;
  onUpdateModelMetrics: (metrics: ModelMetrics) => void;
}

export const CountsScreen: React.FC<CountsScreenProps> = ({
  allKilns,
  modelMetrics,
  onUpdateModelMetrics,
}) => {
  const [precision, setPrecision] = useState<number>(0.8);
  const [recall, setRecall] = useState<number>(0.85);
  const [periodFilter, setPeriodFilter] = useState<'2025-26' | 'ALL'>('2025-26');

  const targetKilns = periodFilter === 'ALL'
    ? allKilns
    : allKilns.filter((k) => k.period === '2025-26');

  const totalDetected = targetKilns.length;
  const fcbkCount = targetKilns.filter((k) => k.class === 'FCBK').length;
  const cfcbkCount = targetKilns.filter((k) => k.class === 'CFCBK').length;
  const zigzagCount = targetKilns.filter((k) => k.class === 'Zigzag').length;

  const unregisteredCount = targetKilns.filter((k) => !k.in_register).length;
  const registeredCount = targetKilns.filter((k) => k.in_register).length;

  const computeRange = (detected: number) => {
    const lower = Math.round(detected * precision);
    const upper = recall > 0 ? Math.round(detected / recall) : detected;
    return { lower, upper };
  };

  const totalRange = computeRange(totalDetected);
  const fcbkRange = computeRange(fcbkCount);
  const cfcbkRange = computeRange(cfcbkCount);
  const zigzagRange = computeRange(zigzagCount);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Statistical Reconciliation
            </div>
            <h1 className="text-xl sm:text-[22px] font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
              Kiln Census &amp; Calibrated Error Ranges
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Honest statistical bounds factoring in false alarms (precision) and undetected sites (recall).
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setPeriodFilter('2025-26')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                periodFilter === '2025-26'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Current 2025-26
            </button>
            <button
              onClick={() => setPeriodFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                periodFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All Detections
            </button>
          </div>
        </div>

        {/* Editable Precision / Recall Calibration Controls */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Model Precision (P)
              </span>
              <span className="font-mono font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-md">
                {(precision * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.99"
              step="0.01"
              value={precision}
              onChange={(e) => setPrecision(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-700 dark:accent-teal-500"
            />
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Lower Bound = Detected &times; Precision (removes estimated false alarms)
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Model Recall (R)
              </span>
              <span className="font-mono font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2 py-0.5 rounded-md">
                {(recall * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.99"
              step="0.01"
              value={recall}
              onChange={(e) => setRecall(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-700 dark:accent-teal-500"
            />
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Upper Bound = Detected / Recall (accounts for missed small kilns)
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Kilns */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Detected Kilns
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-2">
            {totalDetected}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Honest Range: </span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {totalRange.lower} &ndash; {totalRange.upper}
            </span>
          </div>
        </div>

        {/* FCBK */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              FCBK (Bull&apos;s trench)
            </span>
          </div>
          <div className="text-3xl font-bold text-rose-600 dark:text-rose-400 font-mono mt-2">
            {fcbkCount}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Honest Range: </span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {fcbkRange.lower} &ndash; {fcbkRange.upper}
            </span>
          </div>
        </div>

        {/* CFCBK */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              CFCBK (Circular)
            </span>
          </div>
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 font-mono mt-2">
            {cfcbkCount}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Honest Range: </span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {cfcbkRange.lower} &ndash; {cfcbkRange.upper}
            </span>
          </div>
        </div>

        {/* Zigzag */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Zigzag (Clean design)
            </span>
          </div>
          <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 font-mono mt-2">
            {zigzagCount}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Honest Range: </span>
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
              {zigzagRange.lower} &ndash; {zigzagRange.upper}
            </span>
          </div>
        </div>
      </div>

      {/* Official Register Screening Reconciliation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Official Register Screening Reconciliation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">Official Register Capacity</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">312</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Authorized entries in Inspector Farida Khan&apos;s book
            </div>
          </div>

          <div className="bg-amber-50/70 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200/80 dark:border-amber-800/80">
            <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-between">
              <span>Detected Not in Register</span>
              <span className="bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                To verify
              </span>
            </div>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono mt-1">
              {unregisteredCount} kilns
            </div>
            <div className="text-xs text-amber-800 dark:text-amber-300 mt-1">
              Candidate unrecorded sites flagged for field inspection
            </div>
          </div>

          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/80">
            <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              Detected in Official Register
            </div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-1">
              {registeredCount} kilns
            </div>
            <div className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
              Matches active registration records
            </div>
          </div>
        </div>
      </div>

      {/* Model Score Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Detector Benchmark Scorecard
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Evaluation metrics measured on SentinelKilnDB test tiles at IoU threshold 0.5.
            </p>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Evaluator: Local Scorer / YOLO-OBB
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Overall mAP@0.5 */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Overall mAP@0.5
            </label>
            <input
              type="text"
              value={modelMetrics.mAP50}
              onChange={(e) =>
                onUpdateModelMetrics({ ...modelMetrics, mAP50: e.target.value })
              }
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Not yet measured"
            />
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">
              Mean AP across all 3 classes
            </span>
          </div>

          {/* AP FCBK */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              AP (FCBK)
            </label>
            <input
              type="text"
              value={modelMetrics.apFCBK}
              onChange={(e) =>
                onUpdateModelMetrics({ ...modelMetrics, apFCBK: e.target.value })
              }
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Not yet measured"
            />
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">
              Fixed Chimney Bull&apos;s Trench
            </span>
          </div>

          {/* AP CFCBK */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              AP (CFCBK)
            </label>
            <input
              type="text"
              value={modelMetrics.apCFCBK}
              onChange={(e) =>
                onUpdateModelMetrics({ ...modelMetrics, apCFCBK: e.target.value })
              }
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Not yet measured"
            />
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">
              Circular FCBK (Rare class)
            </span>
          </div>

          {/* AP Zigzag */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              AP (Zigzag)
            </label>
            <input
              type="text"
              value={modelMetrics.apZigzag}
              onChange={(e) =>
                onUpdateModelMetrics({ ...modelMetrics, apZigzag: e.target.value })
              }
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Not yet measured"
            />
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">
              Cleaner design (2022 rules)
            </span>
          </div>
        </div>

        {/* Note on rare CFCBK class */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-800 dark:text-slate-200">Evaluation note: </strong>
            <span>
              CFCBK is rare (~3% of training), so its AP is reported separately.
              Never invent values; enter measured results directly from your test evaluation runs.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
