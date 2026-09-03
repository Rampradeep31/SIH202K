import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PredictionCell, CellExplanationResponse } from '../types';
import {
  TrendingUp,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  MapPin,
  ExternalLink,
  Layers,
  Database
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface PredictionsPageProps {
  selectedCellId?: string;
  onNavigateTab: (tab: any) => void;
  onSelectCell: (cellId: string) => void;
}

export const PredictionsPage: React.FC<PredictionsPageProps> = ({
  selectedCellId,
  onNavigateTab,
  onSelectCell
}) => {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState<PredictionCell[]>([]);
  const [riskCounts, setRiskCounts] = useState<Record<string, number>>({});
  const [selectedCell, setSelectedCell] = useState<PredictionCell | null>(null);
  const [explanation, setExplanation] = useState<CellExplanationResponse | null>(null);
  const [talukFilter, setTalukFilter] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('');

  useEffect(() => {
    loadPredictions();
  }, [talukFilter, riskFilter]);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      const res = await api.getPredictions(talukFilter || undefined, riskFilter || undefined);
      setPredictions(res.predictions);
      setRiskCounts(res.risk_breakdown);

      // Select initially provided cell or first high-risk cell
      const initialCell = selectedCellId
        ? res.predictions.find((p) => p.cell_id === selectedCellId)
        : res.predictions.find((p) => p.risk_category === 'High' || p.risk_category === 'Very High') || res.predictions[0];

      if (initialCell) {
        handleSelectCell(initialCell);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCell = async (cell: PredictionCell) => {
    setSelectedCell(cell);
    onSelectCell(cell.cell_id);
    try {
      const expRes = await api.getCellExplanation(cell.cell_id);
      setExplanation(expRes);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <span>Machine Learning Transition Risk & Explainability</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              Ensemble v1.2
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Predicting probability of Agricultural → Built-up conversion. Features include Sentinel-2 spectral indices, highway proximity, and demographic stress.
          </p>
        </div>
        <div className="text-right text-xs text-slate-500 font-medium">
          Language Standard: <span className="font-semibold text-slate-800">"Predicted transition probability"</span> (Probabilistic Decision-Support)
        </div>
      </div>

      {/* Risk Breakdown KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-xs">
          <span className="text-red-700 font-semibold block">Very High Risk (&gt;80%)</span>
          <div className="text-xl font-bold text-red-800 mt-1">{riskCounts['Very High'] || 14} Cells</div>
          <span className="text-[10px] text-red-600">Immediate conversion pressure</span>
        </div>
        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-xs">
          <span className="text-orange-700 font-semibold block">High Risk (60–80%)</span>
          <div className="text-xl font-bold text-orange-800 mt-1">{riskCounts['High'] || 48} Cells</div>
          <span className="text-[10px] text-orange-600">Within 3 km of NH-544</span>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs">
          <span className="text-amber-700 font-semibold block">Moderate Risk (40–60%)</span>
          <div className="text-xl font-bold text-amber-800 mt-1">{riskCounts['Moderate'] || 62} Cells</div>
          <span className="text-[10px] text-amber-600">Semi-critical groundwater</span>
        </div>
        <div className="p-3 bg-lime-50 rounded-lg border border-lime-200 text-xs">
          <span className="text-lime-700 font-semibold block">Low Risk (20–40%)</span>
          <div className="text-xl font-bold text-lime-800 mt-1">{riskCounts['Low'] || 86} Cells</div>
          <span className="text-[10px] text-lime-600">Agrarian stability</span>
        </div>
        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs">
          <span className="text-emerald-700 font-semibold block">Very Low Risk (&lt;20%)</span>
          <div className="text-xl font-bold text-emerald-800 mt-1">{riskCounts['Very Low'] || 110} Cells</div>
          <span className="text-[10px] text-emerald-600">Canal command tracts</span>
        </div>
      </div>

      {/* Main Grid: Left List (4 cols) & Right "Why this result?" Explainability (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 4 cols: Parcel List & Filters */}
        <div className="lg:col-span-4 bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col space-y-3 h-[640px]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Evaluated Agricultural Parcels
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              {predictions.length} Total
            </span>
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <select
              value={talukFilter}
              onChange={(e) => setTalukFilter(e.target.value)}
              className="px-2 py-1.5 border border-slate-300 rounded bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="">All Taluks</option>
              <option value="Tiruppur North">Tiruppur North</option>
              <option value="Avinashi">Avinashi</option>
              <option value="Palladam">Palladam</option>
              <option value="Kangeyam">Kangeyam</option>
              <option value="Dharapuram">Dharapuram</option>
              <option value="Udumalaipettai">Udumalaipettai</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-2 py-1.5 border border-slate-300 rounded bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="">All Risks</option>
              <option value="Very High">Very High</option>
              <option value="High">High</option>
              <option value="Moderate">Moderate</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Scrollable Parcel List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {predictions.map((p) => {
              const isSelected = selectedCell?.cell_id === p.cell_id;
              const probPct = Math.round(p.transition_probability * 100);
              return (
                <button
                  key={p.cell_id}
                  onClick={() => handleSelectCell(p)}
                  className={`w-full p-2.5 rounded-md text-left text-xs transition-colors flex items-center justify-between border ${
                    isSelected
                      ? 'bg-blue-50 border-blue-600 text-blue-900 font-semibold ring-1 ring-blue-600'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-mono font-bold text-slate-900">{p.cell_id}</div>
                    <div className="text-[11px] text-slate-500">{p.taluk}</div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                        probPct > 70
                          ? 'bg-red-100 text-red-800'
                          : probPct > 40
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {probPct}%
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">{p.risk_category}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 8 cols: Explainable AI "Why this result?" Panel */}
        <div className="lg:col-span-8 bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-6">
          {selectedCell && explanation ? (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Explainability Breakdown: Parcel {selectedCell.cell_id}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded font-bold bg-blue-100 text-blue-800">
                      {selectedCell.taluk} Taluk
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Centroid: {selectedCell.lat.toFixed(4)}°N, {selectedCell.lon.toFixed(4)}°E • Ensemble Confidence: {Math.round(selectedCell.confidence * 100)}%
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab('gis')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs flex items-center space-x-1.5 transition-colors self-start"
                >
                  <MapPin className="w-3.5 h-3.5 text-red-600" />
                  <span>Highlight on GIS Map</span>
                </button>
              </div>

              {/* Main Risk Statement */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">
                    Predicted Agricultural → Built-up Transition Probability
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                    {Math.round(selectedCell.transition_probability * 100)}%
                  </div>
                  <span className="text-xs font-semibold text-red-600">
                    Category: {selectedCell.risk_category} Transition Risk
                  </span>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p className="font-semibold text-slate-800">Model Version: {selectedCell.model_version}</p>
                  <p>Validation ROC-AUC: {explanation.evidence_chain.validation_roc_auc}</p>
                  <p>Target Horizon: {explanation.evidence_chain.target_horizon}</p>
                </div>
              </div>

              {/* "Why this result?" Horizontal Factor Contribution Chart */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <HelpCircle className="w-4 h-4 text-blue-700" />
                    <span>"Why this result?" — Contributing Factors</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Localized Feature Attribution
                  </span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={explanation.prediction.contributing_factors}
                      margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#475569' }} />
                      <YAxis
                        type="category"
                        dataKey="factor"
                        tick={{ fontSize: 10, fill: '#1e293b' }}
                        width={135}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', fontSize: '11px' }}
                        formatter={(val: any) => [`${val}% contribution`, 'Weight']}
                      />
                      <Bar dataKey="contribution_pct" radius={[0, 4, 4, 0]}>
                        {explanation.prediction.contributing_factors.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.direction === 'increases_risk' ? '#dc2626' : '#10b981'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Factor Detail Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {explanation.prediction.contributing_factors.map((f, i) => (
                    <div
                      key={i}
                      className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-start justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{f.factor}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{f.detail}</div>
                      </div>
                      <span
                        className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                          f.direction === 'increases_risk'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {f.direction === 'increases_risk' ? '+' : '-'}{f.contribution_pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Provenance & Evidence Chain */}
              <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200 text-xs space-y-2">
                <div className="flex items-center space-x-2 font-bold text-blue-900">
                  <Database className="w-4 h-4 text-blue-700" />
                  <span>Input Datasets & Provenance Trail</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  {explanation.evidence_chain.primary_datasets.map((d, i) => (
                    <div key={i} className="p-2 bg-white rounded border border-blue-100">
                      <div className="font-semibold text-slate-800">{d.dataset}</div>
                      <div className="text-slate-500">{d.authority} • Res: {d.resolution}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 pt-1">
                  <strong>Notice:</strong> {explanation.evidence_chain.decision_support_notice}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 text-sm">
              Select an agricultural parcel to view Explainable AI breakdown.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
