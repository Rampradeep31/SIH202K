import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ScenarioItem } from '../types';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Scale,
  ShieldAlert,
  Calculator
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

interface ScenariosPageProps {
  onNavigateTab: (tab: any) => void;
  onOpenReport: () => void;
}

export const ScenariosPage: React.FC<ScenariosPageProps> = ({ onNavigateTab, onOpenReport }) => {
  const [loading, setLoading] = useState(true);
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [weights, setWeights] = useState({
    development_suitability: 0.25,
    infrastructure_access: 0.25,
    agricultural_preservation: 0.20,
    water_flood_safety: 0.15,
    ecological_protection: 0.15
  });

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    setLoading(true);
    try {
      const res = await api.getScenarios();
      setScenarios(res.scenarios);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightChange = async (key: string, value: number) => {
    const updated = { ...weights, [key]: value };
    setWeights(updated);
    try {
      const res = await api.simulateScenarios(updated);
      setScenarios(res.scenarios);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetWeights = async () => {
    const defaultW = {
      development_suitability: 0.25,
      infrastructure_access: 0.25,
      agricultural_preservation: 0.20,
      water_flood_safety: 0.15,
      ecological_protection: 0.15
    };
    setWeights(defaultW);
    try {
      const res = await api.simulateScenarios(defaultW);
      setScenarios(res.scenarios);
    } catch (err) {
      console.error(err);
    }
  };

  // Prepare chart data for comparative visualization
  const comparisonData = scenarios.map((s) => ({
    name: s.name.split(':')[0],
    overall_score: s.scoring.overall_score,
    agri_preservation: s.indicators.agricultural_preservation,
    infra_access: s.indicators.infrastructure_access,
    water_safety: s.indicators.water_flood_safety
  }));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <span>Policy Scenario Simulator & Sensitivity Engine</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              Multi-Objective
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent policy experimentation. Compare trade-offs between industrial growth corridors, agricultural preservation, and water security.
          </p>
        </div>
        <button
          onClick={onOpenReport}
          className="px-3.5 py-1.5 bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold rounded-md shadow-xs transition-colors self-start"
        >
          Generate Evidence Brief
        </button>
      </div>

      {/* Transparent Formula Banner */}
      <div className="p-4 bg-white rounded-lg border border-blue-200 shadow-2xs space-y-2">
        <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
          <Calculator className="w-4 h-4 text-blue-700" />
          <span>Transparent Land Development Impact Score Formula (0–100)</span>
        </div>
        <div className="p-2.5 bg-slate-50 rounded border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto">
          Score = ({weights.development_suitability.toFixed(2)} × DevSuitability) + ({weights.infrastructure_access.toFixed(2)} × InfraAccess) + ({weights.agricultural_preservation.toFixed(2)} × AgriPreservation) + ({weights.water_flood_safety.toFixed(2)} × WaterSafety) + ({weights.ecological_protection.toFixed(2)} × EcoProtection)
        </div>
        <p className="text-[11px] text-slate-500">
          <strong>Mandatory Classification:</strong> Decision-support score — not a statutory policy decree or automatic rezoning permit.
        </p>
      </div>

      {/* 3 Scenarios Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scenarios.map((s, idx) => {
          const isSustainable = s.id === 'scenario_sustainable';
          return (
            <div
              key={s.id}
              className={`bg-white rounded-lg border p-5 shadow-2xs flex flex-col justify-between space-y-4 ${
                isSustainable ? 'border-emerald-400 ring-1 ring-emerald-300' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{s.name}</span>
                  <span
                    className={`text-sm font-mono font-extrabold px-2.5 py-1 rounded ${
                      isSustainable
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {s.scoring.overall_score}/100
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-snug">{s.tagline}</p>

                {/* Quantitative Impacts */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Projected Agri Loss:</span>
                    <span className="font-mono font-bold text-red-600">
                      {s.indicators.projected_agri_loss_ha.toLocaleString()} ha
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Built-up Footprint Growth:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      +{s.indicators.projected_built_growth_pct}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Economic Output Growth:</span>
                    <span className="font-mono font-semibold text-emerald-700">
                      ₹{s.indicators.economic_output_growth_cr.toLocaleString()} Cr
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Groundwater Exposure:</span>
                    <span className="font-semibold text-amber-700 text-right text-[11px] max-w-[150px]">
                      {s.indicators.groundwater_stress_exposure}
                    </span>
                  </div>
                </div>

                {/* Score Component Breakdown */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                    Score Components Contribution:
                  </span>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Agri Preservation:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {s.scoring.component_contributions.agricultural_preservation} pts
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Water / Flood Safety:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {s.scoring.component_contributions.water_flood_safety} pts
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Infrastructure Access:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {s.scoring.component_contributions.infrastructure_access} pts
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                {isSustainable
                  ? 'Recommended: Balances Noyyal basin protection with planned SIPCOT cluster growth.'
                  : 'Trade-off: Heavy pressure on groundwater and agrarian livelihoods along NH-544.'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sensitivity Analysis Control Panel ("What changes the result?") */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-blue-700" />
              <span>Sensitivity Analysis: "What changes the result?"</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Adjust policy objective weights in real time to observe the sensitivity of scenario scores and trade-offs.
            </p>
          </div>
          <button
            onClick={handleResetWeights}
            className="flex items-center space-x-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Weights</span>
          </button>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
          {/* Slider 1: Agri Preservation */}
          <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-800">Agricultural Preservation Priority</span>
              <span className="font-mono font-bold text-emerald-700">
                {weights.agricultural_preservation.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.50"
              step="0.05"
              value={weights.agricultural_preservation}
              onChange={(e) => handleWeightChange('agricultural_preservation', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Penalizes farmland loss & enforces Section 47A audits.</p>
          </div>

          {/* Slider 2: Infrastructure Priority */}
          <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-800">Infrastructure Proximity Priority</span>
              <span className="font-mono font-bold text-blue-700">
                {weights.infrastructure_access.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.50"
              step="0.05"
              value={weights.infrastructure_access}
              onChange={(e) => handleWeightChange('infrastructure_access', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Rewards development adjacent to NH-544 and rail links.</p>
          </div>

          {/* Slider 3: Water/Flood Safety */}
          <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-800">Water / Flood / Groundwater Safety</span>
              <span className="font-mono font-bold text-cyan-700">
                {weights.water_flood_safety.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.50"
              step="0.05"
              value={weights.water_flood_safety}
              onChange={(e) => handleWeightChange('water_flood_safety', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Protects Noyyal riparian buffers & over-exploited blocks.</p>
          </div>

          {/* Slider 4: Development Suitability */}
          <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-800">Economic Development Weight</span>
              <span className="font-mono font-bold text-indigo-700">
                {weights.development_suitability.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.50"
              step="0.05"
              value={weights.development_suitability}
              onChange={(e) => handleWeightChange('development_suitability', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Prioritizes textile industrial expansion & employment.</p>
          </div>

          {/* Slider 5: Ecological Protection */}
          <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-800">Ecological Protection Weight</span>
              <span className="font-mono font-bold text-emerald-700">
                {weights.ecological_protection.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.50"
              step="0.05"
              value={weights.ecological_protection}
              onChange={(e) => handleWeightChange('ecological_protection', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Mandates green buffers and soil conservation.</p>
          </div>
        </div>

        {/* Live Comparison Bar Chart */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Simulated Scenario Impact Comparison
          </h4>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="overall_score" name="Overall Policy Score" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="agri_preservation" name="Agri Preservation" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="infra_access" name="Infra Access" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="water_safety" name="Water Safety" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
