import React, { useState } from 'react';
import { Kiln } from '../types';
import { parseKilnData, generateSampleCsv, generateSampleJson, downloadTextFile } from '../utils/fileParser';
import { UploadCloud, FileSpreadsheet, FileCode, RotateCcw, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DataModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDemoData: boolean;
  kilnsCount: number;
  onLoadCustomData: (kilns: Kiln[]) => void;
  onResetToDemo: () => void;
}

export const DataModal: React.FC<DataModalProps> = ({
  isOpen,
  onClose,
  isDemoData,
  kilnsCount,
  onLoadCustomData,
  onResetToDemo,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseKilnData(text, file.name);

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to parse file.');
      } else if (result.data) {
        onLoadCustomData(result.data);
        setSuccessMessage(`Successfully imported ${result.data.length} detections from ${file.name}!`);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Could not read the uploaded file.');
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-2 rounded-xl transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
          Data Pipeline
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
          Manage Detection Dataset
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Upload your own Sentinel-2 YOLO-OBB detections (CSV or JSON) to replace the bundled demo district.
        </p>

        {/* Current dataset indicator */}
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Active Dataset</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {isDemoData ? 'Bundled Synthetic Demo Dataset' : 'Custom Uploaded Detections'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-semibold">Record Count</span>
            <span className="font-mono font-bold text-teal-700 dark:text-teal-400">{kilnsCount} kilns</span>
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`mt-4 border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            isDragging
              ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/40'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30'
          }`}
          onClick={() => document.getElementById('data-file-input')?.click()}
        >
          <input
            id="data-file-input"
            type="file"
            accept=".csv,.json,text/csv,application/json"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-teal-700 dark:text-teal-400 flex items-center justify-center mx-auto mb-2 shadow-sm">
            <UploadCloud className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Click to upload or drag &amp; drop file
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Accepts CSV or JSON with columns: id, lat, lon, class, confidence, angle_deg, width_m, height_m, period, tile_id, in_register.
          </p>
        </div>

        {/* Short inline error if bad file */}
        {errorMessage && (
          <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">File Error: </strong>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Success Feedback */}
        {successMessage && (
          <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Sample file buttons and Reset */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadTextFile(generateSampleCsv(), 'sample_kiln_detections.csv', 'text/csv')}
              className="min-h-[44px] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Sample CSV</span>
            </button>
            <button
              onClick={() => downloadTextFile(generateSampleJson(), 'sample_kiln_detections.json', 'application/json')}
              className="min-h-[44px] text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Sample JSON</span>
            </button>
          </div>

          {!isDemoData && (
            <button
              onClick={() => {
                onResetToDemo();
                setSuccessMessage('Reset to bundled demo dataset.');
                setTimeout(() => onClose(), 800);
              }}
              className="min-h-[44px] text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Demo Data</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
