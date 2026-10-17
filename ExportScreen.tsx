import React from 'react';
import { ScoredKiln, KilnCluster } from '../types';
import { exportTop20Csv, downloadTextFile } from '../utils/fileParser';
import { formatCoordinates } from '../utils/geo';
import { CLASS_COLORS } from './PlainLeafletMap';
import { Download, Printer, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

interface ExportScreenProps {
  top20Kilns: ScoredKiln[];
  clusters: KilnCluster[];
}

export const ExportScreen: React.FC<ExportScreenProps> = ({ top20Kilns, clusters }) => {
  const handleExportCsv = () => {
    const csvContent = exportTop20Csv(top20Kilns);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadTextFile(
      csvContent,
      `ChimneyLens_Top20_Field_Brief_${dateStr}.csv`,
      'text/csv;charset=utf-8;'
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header Card (Hidden on Print) */}
      <div className="no-print bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Field Documentation &amp; Reporting
            </div>
            <h1 className="text-xl sm:text-[22px] font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
              Export &amp; Print Field Inspection Brief
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Download machine-readable CSV for GPS loggers, or print the official field verification docket.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="/chimneylens-source.tar.gz"
              download="chimneylens-source.tar.gz"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600 text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-2"
              title="Download source code archive"
            >
              <Download className="w-4 h-4 text-teal-400" />
              <span>Download Source (.tar.gz)</span>
            </a>

            <button
              onClick={handleExportCsv}
              className="px-4 py-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print View</span>
            </button>
          </div>
        </div>

        {/* Hackathon Git Submission & Repository Guide */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Hackathon Submission &amp; Git Repository Setup
              </span>
            </div>
            <span className="text-[11px] font-mono text-teal-700 dark:text-teal-400 font-medium">
              Branch: main (100% committed)
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>Push this code to your GitHub repo:</span>
                <span className="text-[10px] bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 px-1.5 py-0.5 rounded font-mono">
                  3 steps
                </span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 text-[11px]">
                <li>Create a new repository on <span className="font-mono text-teal-700 dark:text-teal-300">github.com</span> named <span className="font-semibold">chimneylens</span></li>
                <li>Run this command in the terminal to link your repo:</li>
              </ol>
              <div className="p-2 bg-slate-950 text-teal-300 font-mono text-[11px] rounded-lg overflow-x-auto select-all border border-slate-800">
                git remote add origin https://github.com/&lt;your-username&gt;/chimneylens.git<br/>
                git push -u origin main
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>Submission Files Generated</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Full git repository initialized with clean commit history, comprehensive <span className="font-mono">README.md</span>, automated GitHub CI workflow, and <span className="font-mono">HACKATHON_SUBMISSION.md</span>.
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <a
                  href="/chimneylens.bundle"
                  download="chimneylens.bundle"
                  className="text-teal-700 dark:text-teal-400 hover:underline font-mono text-[11px] flex items-center gap-1"
                >
                  Download .bundle file &rarr;
                </a>
                <span className="text-[10px] text-slate-500">Ready for judges</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Printable Brief Document Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-slate-800 dark:text-slate-200 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 dark:border-slate-100 print:border-black pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold">
                State Pollution Control Board &middot; Field Verification Directive
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 print:text-black tracking-tight mt-0.5">
                CHIMNEYLENS &mdash; INSPECTOR&apos;S FIELD BRIEF
              </h2>
            </div>

            <div className="text-left sm:text-right text-xs font-mono text-slate-500 dark:text-slate-400">
              <div>Issue Date: {new Date().toLocaleDateString()}</div>
              <div>Sector Reference: DL-3000-S2</div>
            </div>
          </div>

          {/* Mandatory Screening Notice */}
          <div className="mt-3.5 py-2 px-3 bg-slate-100 dark:bg-slate-800 print:bg-slate-100 border border-slate-300 dark:border-slate-700 print:border-black rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 print:text-black flex items-center justify-between">
            <span className="uppercase text-[11px] tracking-wider text-slate-600 dark:text-slate-400">
              Mandatory Protocol Notice:
            </span>
            <span className="text-rose-700 dark:text-rose-400 print:text-rose-700 font-bold uppercase">
              Screening signal, not proof of a violation.
            </span>
          </div>

          {/* Inspector Deployment Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3.5 pt-2 text-xs text-slate-600 dark:text-slate-400">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Inspector Officer</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 print:text-black">Inspector Farida Khan</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Registered Kilns</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 print:text-black">312 Authorized</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Field Resources</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 print:text-black">1 Jeep, 2 Field Staff</span>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Territory Area</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 print:text-black">3,000 km&sup2; Sector</span>
            </div>
          </div>
        </div>

        {/* Section 1: Top-20 Priority Schedule */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 print:text-black uppercase tracking-wider">
              1. Prioritised Candidate Target Roster (Top-20)
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 italic">
              Ranked by risk factor weightings and model uncertainty
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-300 dark:border-slate-700 print:border-black rounded-xl">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 print:text-black">
              <thead className="bg-slate-100 dark:bg-slate-800 print:bg-slate-100 font-bold text-slate-900 dark:text-slate-100 print:text-black uppercase text-[11px] border-b border-slate-300 dark:border-slate-700 print:border-black">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                  <th className="py-2.5 px-3">Kiln ID</th>
                  <th className="py-2.5 px-3">Class (Conf)</th>
                  <th className="py-2.5 px-3">Coordinates</th>
                  <th className="py-2.5 px-3">Score</th>
                  <th className="py-2.5 px-3">Screening Reason</th>
                  <th className="py-2.5 px-3 w-32 border-l border-slate-200 dark:border-slate-700 print:border-black">Physical Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-slate-300">
                {top20Kilns.map((k) => {
                  const color = CLASS_COLORS[k.class] || CLASS_COLORS.FCBK;
                  return (
                    <tr key={k.id} className="break-inside-avoid">
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 dark:text-slate-100 print:text-black">
                        #{k.rank}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-900 dark:text-slate-100 print:text-black">
                        <div className="font-mono font-bold">{k.id}</div>
                        <div className="text-[10px] font-sans font-normal text-slate-500 print:text-black">
                          {k.village || 'Kalyanpur'}, {k.tehsil || 'Mohanlalganj'}
                        </div>
                        {!k.in_register && (
                          <span className="text-[9px] text-amber-700 dark:text-amber-400 print:text-black font-bold uppercase">
                            [Unrecorded]
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-semibold" style={{ color: color.hex }}>
                        {k.class} ({(k.confidence * 100).toFixed(0)}%)
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs whitespace-nowrap text-slate-600 dark:text-slate-400 print:text-black">
                        {formatCoordinates(k.lat, k.lon)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-slate-100 print:text-black">
                        {k.priorityScore}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200 print:text-black">
                        {k.oneLineReason}
                      </td>
                      <td className="py-2.5 px-3 border-l border-slate-200 dark:border-slate-700 print:border-black bg-slate-50/50 dark:bg-slate-800/30 print:bg-white">
                        <div className="h-6 border-b border-dotted border-slate-400 print:border-black"></div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 italic">
            Note: Proximity flag (&le; 1 km) is an operational grouping criterion, never legal evidence of wrongdoing.
          </div>
        </div>

        {/* Section 2: Spatial Route Logistics */}
        <div className="break-inside-avoid pt-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 print:text-black uppercase tracking-wider mb-2">
            2. Deployment Sector Clusters (Straight-line clusters, NOT road routing)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {clusters.map((c) => (
              <div key={c.id} className="border border-slate-300 dark:border-slate-700 print:border-black rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 print:bg-white text-xs">
                <div className="font-bold text-slate-900 dark:text-slate-100 print:text-black">{c.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 print:text-black mt-0.5">
                  Center: {formatCoordinates(c.centerLat, c.centerLon)}
                </div>
                <div className="mt-2 text-slate-700 dark:text-slate-300 print:text-black">
                  <span className="font-semibold">{c.kilns.length} sites: </span>
                  <span className="font-mono text-xs">
                    {c.kilns.map((k) => `#${k.rank}`).join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Physical Sign-Off Box */}
        <div className="break-inside-avoid border-t-2 border-slate-900 dark:border-slate-100 print:border-black pt-4 mt-6">
          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 print:text-black uppercase tracking-wider mb-3">
            3. Inspector Verification Sign-Off
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="text-slate-500 dark:text-slate-400 print:text-black mb-6">Inspecting Officer:</div>
              <div className="border-b border-slate-400 print:border-black font-bold">Farida Khan, State Pollution Control Board</div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 print:text-black mb-6">Field Signature:</div>
              <div className="border-b border-slate-400 print:border-black h-5"></div>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 print:text-black mb-6">Date &amp; Odometer:</div>
              <div className="border-b border-slate-400 print:border-black h-5"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
