import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { LulcComparisonItem, TransitionMatrixRow, KeyTransitionItem } from '../types';
import {
  GitCommit,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  MapPin,
  ExternalLink,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface LulcChangePageProps {
  onNavigateTab: (tab: any) => void;
}

export const LulcChangePage: React.FC<LulcChangePageProps> = ({ onNavigateTab }) => {
  const [loading, setLoading] = useState(true);
  const [comparison, setComparison] = useState<LulcComparisonItem[]>([]);
  const [matrix, setMatrix] = useState<TransitionMatrixRow[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [keyTransitions, setKeyTransitions] = useState<KeyTransitionItem[]>([]);
  const [selectedTransition, setSelectedTransition] = useState<KeyTransitionItem | null>(null);

  useEffect(() => {
    Promise.all([
      api.getLulcSummary(),
      api.getLulcChange()
    ])
      .then(([sumRes, changeRes]) => {
        setComparison(sumRes.comparison);
        setMatrix(changeRes.matrix);
        setClasses(changeRes.classes);
        setKeyTransitions(changeRes.key_transitions);
        if (changeRes.key_transitions.length > 0) {
          setSelectedTransition(changeRes.key_transitions[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Computing 5-Year LULC Transition Dynamics...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <span>Land Use / Land Cover (LULC) Change Analytics</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              2018 → 2023
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-temporal satellite-derived conversion dynamics across Tiruppur District, Tamil Nadu.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('gis')}
          className="text-xs font-semibold text-blue-800 hover:text-blue-900 flex items-center space-x-1"
        >
          <span>View on Map</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {comparison.map((c) => {
          const isNegative = c.net_change_ha < 0;
          return (
            <div key={c.lulc_class} className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs">
              <div className="text-xs font-semibold text-slate-500 mb-1">{c.lulc_class}</div>
              <div className="text-xl font-bold text-slate-900">{c.area_2023_ha.toLocaleString()} ha</div>
              <div className="flex items-center space-x-1 mt-1 text-xs">
                {isNegative ? (
                  <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span className={isNegative ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                  {c.net_change_ha > 0 ? `+${c.net_change_ha}` : c.net_change_ha} ha ({c.net_change_pct}%)
                </span>
                <span className="text-slate-400 text-[10px]">vs 2018</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* LULC Transition Matrix */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              LULC Transition Matrix (2018 Baseline → 2023 Current)
            </h2>
            <p className="text-[11px] text-slate-500">
              Values in Hectares (Rows = 2018 class, Columns = 2023 class). Highlights diagonal retention vs cross-conversion.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Unit: Hectares (ha)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3 border-b border-r border-slate-200">2018 Class \ 2023 Class</th>
                {classes.map((col) => (
                  <th key={col} className="p-3 border-b border-r border-slate-200 text-right">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900 border-b border-r border-slate-200 bg-slate-50/50">
                    {row.from_class}
                  </td>
                  {classes.map((col) => {
                    const val = Number(row[col]) || 0;
                    const isDiagonal = row.from_class === col;
                    const isAgriToBuilt = row.from_class === 'Agriculture' && col === 'Built-up';
                    return (
                      <td
                        key={col}
                        className={`p-3 border-b border-r border-slate-200 text-right font-mono ${
                          isAgriToBuilt
                            ? 'bg-red-50 text-red-700 font-bold'
                            : isDiagonal
                            ? 'bg-emerald-50/40 text-slate-800 font-medium'
                            : 'text-slate-600'
                        }`}
                      >
                        {val.toLocaleString()}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" />
              <span>Critical Conversion Corridor (Agri → Built-up)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-300 inline-block" />
              <span>Stable Retained Land Use</span>
            </span>
          </div>
          <span className="font-medium">Total evaluated sample: ~8,000 ha</span>
        </div>
      </div>

      {/* Key Transition Spotlight */}
      {selectedTransition && (
        <div className="bg-white p-5 rounded-lg border border-red-200 shadow-2xs space-y-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="text-xs font-bold text-red-900 uppercase tracking-wider">
              Primary Transition Focus: {selectedTransition.transition}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 font-medium">Converted Agricultural Area:</span>
              <div className="text-lg font-bold text-red-600">
                {selectedTransition.area_ha.toLocaleString()} ha
              </div>
              <p className="text-[11px] text-slate-400">
                {selectedTransition.pct_of_original_agri}% of baseline agricultural extent
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 font-medium">Identified Geographic Hotspots:</span>
              <ul className="list-disc list-inside text-slate-800 text-[11px] space-y-0.5">
                {selectedTransition.hotspots.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <span className="text-slate-500 font-medium">Primary Socio-Economic Drivers:</span>
              <ul className="list-disc list-inside text-slate-800 text-[11px] space-y-0.5">
                {selectedTransition.drivers.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
