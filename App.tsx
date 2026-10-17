/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Kiln, ScoredKiln, ModelMetrics } from './types';
import { DEMO_KILNS } from './data/demoKilns';
import { computePriorityScores, getTop20Kilns } from './utils/scoring';
import { clusterTopKilns } from './utils/clustering';

import { HomeScreen } from './components/HomeScreen';
import { DetectScreen } from './components/DetectScreen';
import { MapScreen } from './components/MapScreen';
import { CountsScreen } from './components/CountsScreen';
import { ConversionScreen } from './components/ConversionScreen';
import { VisitListScreen } from './components/VisitListScreen';
import { OneDayPlanScreen } from './components/OneDayPlanScreen';
import { ExportScreen } from './components/ExportScreen';
import { DataModal } from './components/DataModal';

import {
  Home,
  Crosshair,
  Map as MapIcon,
  BarChart3,
  GitCompare,
  ClipboardList,
  CalendarDays,
  FileSpreadsheet,
  Upload,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Info,
} from 'lucide-react';

type TabId = 'home' | 'detect' | 'map' | 'counts' | 'convert' | 'visits' | 'plan' | 'export';
type ThemeMode = 'system' | 'light' | 'dark';

interface NavTab {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

export default function App() {
  const [kilns, setKilns] = useState<Kiln[]>(DEMO_KILNS);
  const [isDemoData, setIsDemoData] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [selectedKiln, setSelectedKiln] = useState<Kiln | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const [isFooterExpanded, setIsFooterExpanded] = useState<boolean>(false);

  // Dark mode state: follows system or manual toggle
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState<boolean>(false);

  // Sync theme with system and manual setting
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const computeIsDark = () => {
      if (themeMode === 'dark') return true;
      if (themeMode === 'light') return false;
      return mediaQuery.matches;
    };

    const resolved = computeIsDark();
    setIsDark(resolved);

    if (resolved) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const handler = () => {
      if (themeMode === 'system') {
        const dark = mediaQuery.matches;
        setIsDark(dark);
        if (dark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [themeMode]);

  // Model benchmark scores
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics>({
    mAP50: 'Not yet measured',
    apFCBK: 'Not yet measured',
    apCFCBK: 'Not yet measured',
    apZigzag: 'Not yet measured',
  });

  // Calculate Top-20 scored kilns dynamically
  const scoredKilns = useMemo(() => {
    return computePriorityScores(kilns);
  }, [kilns]);

  const top20Kilns = useMemo(() => {
    return getTop20Kilns(scoredKilns);
  }, [scoredKilns]);

  // Clusters for Top-20
  const clusters = useMemo(() => {
    return clusterTopKilns(top20Kilns, 3);
  }, [top20Kilns]);

  const handleSelectKiln = (k: Kiln | null) => {
    setSelectedKiln(k);
    if (k && activeTab !== 'map') {
      setActiveTab('map');
    }
  };

  const navTabs: NavTab[] = [
    {
      id: 'home',
      label: 'Home Overview',
      shortLabel: 'Home',
      icon: <Home className="w-4 h-4" />,
    },
    {
      id: 'detect',
      label: 'Detection Viewer',
      shortLabel: 'Detect',
      icon: <Crosshair className="w-4 h-4" />,
    },
    {
      id: 'map',
      label: 'District Map',
      shortLabel: 'Map',
      icon: <MapIcon className="w-4 h-4" />,
    },
    {
      id: 'counts',
      label: 'Counts & Ranges',
      shortLabel: 'Counts',
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: 'convert',
      label: 'Did It Convert?',
      shortLabel: 'Convert',
      icon: <GitCompare className="w-4 h-4" />,
    },
    {
      id: 'visits',
      label: 'Top-20 Visit List',
      shortLabel: 'Visits',
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      id: 'plan',
      label: '1-Day Plan',
      shortLabel: 'Plan',
      icon: <CalendarDays className="w-4 h-4" />,
    },
    {
      id: 'export',
      label: 'Export Brief',
      shortLabel: 'Export',
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* 1. Slim Top Header */}
      <header className="no-print sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Brand & Badges */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
              CL
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-slate-100 truncate">
                ChimneyLens
              </span>

              {/* Demo Data Badge */}
              {isDemoData ? (
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                  Demo data
                </span>
              ) : (
                <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                  Custom ({kilns.length})
                </span>
              )}

              {/* Screening Only Badge */}
              <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 hidden sm:inline-flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Screening only</span>
              </span>
            </div>
          </div>

          {/* Right Header Controls: Dark Mode Toggle + Upload Data */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={() => {
                if (themeMode === 'system') setThemeMode('dark');
                else if (themeMode === 'dark') setThemeMode('light');
                else setThemeMode('system');
              }}
              className="min-h-[44px] min-w-[44px] p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center justify-center"
              title={`Current theme: ${themeMode} (click to toggle)`}
              aria-label="Toggle theme mode"
            >
              {themeMode === 'dark' ? (
                <Moon className="w-4 h-4 text-teal-400" />
              ) : themeMode === 'light' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Monitor className="w-4 h-4" />
              )}
            </button>

            {/* Upload Button */}
            <button
              onClick={() => setIsDataModalOpen(true)}
              className="min-h-[44px] px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
              title="Upload custom detections or sample files"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isDemoData ? 'Upload Detections' : 'Manage Data'}</span>
              <span className="sm:hidden">Data</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Responsive App Body: Desktop Left Sidebar + Main Content */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Desktop Left Sidebar (>= lg) */}
        <aside className="no-print hidden lg:flex flex-col w-60 shrink-0 border-r border-slate-200 dark:border-slate-800 p-4 space-y-6">
          {/* Persona Card */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Assigned Inspector
            </div>
            <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Farida Khan
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              312 registered kilns &middot; 1 jeep, 2 staff &middot; 3,000 km&sup2;
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Navigation
            </div>
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2.5 text-left ${
                    isActive
                      ? 'bg-teal-700 text-white font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Screening Protocol Quick Card */}
          <div className="mt-auto p-3 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-900/60 text-xs text-teal-900 dark:text-teal-300 space-y-1">
            <div className="font-semibold text-[11px] flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400 shrink-0" />
              <span>Screening Standard</span>
            </div>
            <p className="text-[11px] text-teal-800 dark:text-teal-300 leading-normal">
              A candidate flag indicates priority for field inspection, never confirmation of illegal operation.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-10 min-w-0">
          {activeTab === 'home' && (
            <HomeScreen
              allKilns={kilns}
              top20Kilns={top20Kilns}
              onNavigateToTab={(t) => setActiveTab(t as TabId)}
              onSelectKiln={handleSelectKiln}
            />
          )}
          {activeTab === 'detect' && <DetectScreen allKilns={kilns} />}
          {activeTab === 'map' && (
            <MapScreen
              allKilns={kilns}
              top20Kilns={top20Kilns}
              selectedKiln={selectedKiln}
              onSelectKiln={handleSelectKiln}
              isDark={isDark}
            />
          )}
          {activeTab === 'counts' && (
            <CountsScreen
              allKilns={kilns}
              modelMetrics={modelMetrics}
              onUpdateModelMetrics={setModelMetrics}
            />
          )}
          {activeTab === 'convert' && (
            <ConversionScreen
              allKilns={kilns}
              onSelectKiln={(k) => handleSelectKiln(k)}
            />
          )}
          {activeTab === 'visits' && (
            <VisitListScreen
              top20Kilns={top20Kilns}
              onSelectKiln={handleSelectKiln}
              onNavigateToTab={(t) => setActiveTab(t as TabId)}
            />
          )}
          {activeTab === 'plan' && (
            <OneDayPlanScreen
              top20Kilns={top20Kilns}
              allKilns={kilns}
              onSelectKiln={handleSelectKiln}
              onNavigateToTab={(t) => setActiveTab(t as TabId)}
              isDark={isDark}
            />
          )}
          {activeTab === 'export' && (
            <ExportScreen top20Kilns={top20Kilns} clusters={clusters} />
          )}
        </main>
      </div>

      {/* 3. Mobile Bottom Tab Bar (< lg) */}
      <nav
        aria-label="Mobile navigation"
        className="no-print lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800"
      >
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1 overflow-x-auto">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[44px] min-w-[44px] flex-1 flex flex-col items-center justify-center transition-colors px-1 ${
                  isActive
                    ? 'text-teal-700 dark:text-teal-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 scale-105' : ''
                  }`}
                >
                  {tab.icon}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[48px]">
                  {tab.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 4. Small, Tidy, Collapsible Footer Strip */}
      <footer className="no-print bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400 shrink-0"></span>
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                SentinelKilnDB &middot; Mondal et al., Sustainability Lab, IIT Gandhinagar (NeurIPS 2025)
              </span>
            </div>

            <button
              onClick={() => setIsFooterExpanded(!isFooterExpanded)}
              className="min-h-[32px] px-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1 text-[11px] shrink-0"
              aria-label="Toggle citation details"
            >
              <span>{isFooterExpanded ? 'Less' : 'Citation & license'}</span>
              {isFooterExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {isFooterExpanded && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1 animate-in fade-in duration-150">
              <p>
                <strong>Dataset credit:</strong> SentinelKilnDB, Mondal et al., Sustainability Lab, IIT Gandhinagar, NeurIPS 2025 Datasets &amp; Benchmarks. Licensed CC BY-NC (non-commercial use only).
              </p>
              <p>
                ChimneyLens prototype designed for environmental inspector field screening. Oriented object detection baseline: YOLO-OBB on Sentinel-2 10 m GSD tiles.
              </p>
            </div>
          )}
        </div>
      </footer>

      {/* Data Management Modal */}
      <DataModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        isDemoData={isDemoData}
        kilnsCount={kilns.length}
        onLoadCustomData={(newKilns) => {
          setKilns(newKilns);
          setIsDemoData(false);
        }}
        onResetToDemo={() => {
          setKilns(DEMO_KILNS);
          setIsDemoData(true);
        }}
      />
    </div>
  );
}
