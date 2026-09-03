import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ModelMetrics } from '../types';
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Scale,
  ShieldCheck,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export const ModelsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<ModelMetrics[]>([]);
  const [comparisonSummary, setComparisonSummary] = useState<any>(null);
  const [selectedModelIdx, setSelectedModelIdx] = useState<number>(0);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setLoading(true);
    try {
      const res = await api.getModelsEvaluation();
      setModels(res.models);
      setComparisonSummary(res.comparison_summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || models.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Loading Model Evaluation & Monitoring Engine...
      </div>
    );
  }

  const currentModel = models[selectedModelIdx];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <span>Model Evaluation & Monitoring Dashboard</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              Audit Standard
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-validation, calibration curves, confusion matrices, and feature attribution across dual tree ensembles.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setSelectedModelIdx(0)}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              selectedModelIdx === 0
                ? 'bg-blue-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Model A: Random Forest
          </button>
          <button
            onClick={() => setSelectedModelIdx(1)}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              selectedModelIdx === 1
                ? 'bg-blue-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Model B: Gradient Boosting
          </button>
        </div>
      </div>

      {/* Model Performance Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Validation ROC-AUC</span>
          <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
            {currentModel.roc_auc}
          </div>
          <span className="text-[10px] text-slate-400">5-Fold Stratified</span>
        </div>

        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Precision</span>
          <div className="text-xl font-bold font-mono text-blue-700 mt-1">
            {currentModel.precision}
          </div>
          <span className="text-[10px] text-slate-400">Conversion class</span>
        </div>

        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Recall</span>
          <div className="text-xl font-bold font-mono text-indigo-700 mt-1">
            {currentModel.recall}
          </div>
          <span className="text-[10px] text-slate-400">Sensitivity</span>
        </div>

        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">F1-Score</span>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {currentModel.f1_score}
          </div>
          <span className="text-[10px] text-slate-400">Harmonic mean</span>
        </div>

        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">PR-AUC</span>
          <div className="text-xl font-bold font-mono text-purple-700 mt-1">
            {currentModel.pr_auc}
          </div>
          <span className="text-[10px] text-slate-400">Precision-Recall</span>
        </div>

        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-medium">Sample Size</span>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1">
            {currentModel.sample_size}
          </div>
          <span className="text-[10px] text-slate-400">Agricultural parcels</span>
        </div>
      </div>

      {/* Middle Grid: Feature Importance (7 cols) & Confusion Matrix + Calibration (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Feature Importance */}
        <div className="lg:col-span-7 bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Feature Importance Ranking ({currentModel.model_name})
              </h2>
              <p className="text-[11px] text-slate-500">
                Gini impurity decrease / gradient contribution per geospatial variable
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">Unit: %</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={currentModel.feature_importance}
                margin={{ top: 5, right: 20, left: 140, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#1e293b' }}
                  width={135}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', fontSize: '11px' }}
                />
                <Bar dataKey="importance_pct" fill="#1e3a8a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 5 cols: Confusion Matrix & Calibration Diagram */}
        <div className="lg:col-span-5 space-y-4">
          {/* Confusion Matrix Box */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Cross-Validated Confusion Matrix
            </h3>
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
              <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
                <div className="text-[10px] text-slate-500 font-sans">True Negative (Retained)</div>
                <div className="text-lg font-bold text-emerald-800 mt-0.5">
                  {currentModel.confusion_matrix.true_negative}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 font-sans">False Positive</div>
                <div className="text-lg font-bold text-slate-700 mt-0.5">
                  {currentModel.confusion_matrix.false_positive}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <div className="text-[10px] text-slate-500 font-sans">False Negative</div>
                <div className="text-lg font-bold text-slate-700 mt-0.5">
                  {currentModel.confusion_matrix.false_negative}
                </div>
              </div>
              <div className="p-3 bg-red-50 rounded border border-red-200">
                <div className="text-[10px] text-slate-500 font-sans">True Positive (Converted)</div>
                <div className="text-lg font-bold text-red-800 mt-0.5">
                  {currentModel.confusion_matrix.true_positive}
                </div>
              </div>
            </div>
          </div>

          {/* Reliability / Calibration Curve */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Reliability & Probability Calibration
              </h3>
              <span className="text-[10px] text-emerald-700 font-semibold">Well-Calibrated</span>
            </div>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentModel.calibration_curve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="predicted_bin" tick={{ fontSize: 10, fill: '#475569' }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: '#475569' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="observed_fraction" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Model Governance Metadata & Limitations */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Model Governance Card & Technical Limitations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="font-semibold text-slate-800 block mb-1">Spatial Validation Method</span>
            <p className="text-slate-600 text-[11px]">
              Stratified 5-Fold Cross-Validation with spatial grouping to prevent spatial autocorrelation leakage between adjacent parcels.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="font-semibold text-slate-800 block mb-1">Training Inputs</span>
            <p className="text-slate-600 text-[11px]">
              Sentinel-2 Multi-Spectral Indices (B4, B8, B11, B3), NRSC Bhuvan LULC, OGD Demographics, and OSM Vector Highways.
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded border border-amber-200">
            <span className="font-semibold text-amber-900 block mb-1">Mandatory Governance Limitation</span>
            <p className="text-amber-800 text-[11px]">
              {currentModel.limitations}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
