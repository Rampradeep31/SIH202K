import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ExecutiveReport } from '../types';
import { Printer, X, Download, ShieldCheck, FileCheck } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, userRole }) => {
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState('scenario_sustainable');
  const [selectedTaluk, setSelectedTaluk] = useState('Avinashi');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.generateReport(selectedScenario, selectedTaluk, userRole)
        .then((res) => {
          setReport(res);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [isOpen, selectedScenario, selectedTaluk, userRole]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Controls Header */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-bold">Executive Evidence Brief Generator</span>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="text-xs bg-slate-800 text-white border border-slate-700 rounded px-2.5 py-1 focus:outline-hidden"
            >
              <option value="scenario_sustainable">Sustainable Development (Scenario 3)</option>
              <option value="scenario_industrial">Industrial Expansion (Scenario 2)</option>
              <option value="scenario_baseline">Baseline BAU (Scenario 1)</option>
            </select>
            <select
              value={selectedTaluk}
              onChange={(e) => setSelectedTaluk(e.target.value)}
              className="text-xs bg-slate-800 text-white border border-slate-700 rounded px-2.5 py-1 focus:outline-hidden"
            >
              <option value="Avinashi">Avinashi Taluk</option>
              <option value="Tiruppur North">Tiruppur North</option>
              <option value="Palladam">Palladam</option>
              <option value="Dharapuram">Dharapuram</option>
            </select>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Brief</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-slate-800 bg-white">
          {loading ? (
            <div className="py-20 text-center text-slate-500 text-sm">
              Compiling multi-source evidence brief...
            </div>
          ) : report ? (
            <div className="space-y-6">
              {/* Document Header */}
              <div className="border-b-2 border-slate-800 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                      {report.jurisdiction}
                    </span>
                    <h1 className="text-xl font-extrabold text-slate-900 mt-1">
                      {report.title}
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Focal District: {report.pilot_region.district} • Sub-district: {report.pilot_region.focal_taluk} • Evaluated Area: 518,700 ha
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p className="font-semibold text-slate-800">Date: {report.date_generated}</p>
                    <p>Issuing: {report.issuing_entity}</p>
                    <p>Role Context: {report.generated_for_role}</p>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="p-4 bg-slate-50 border-l-4 border-blue-800 rounded-r-md text-xs leading-relaxed text-slate-700">
                <h3 className="font-bold text-slate-900 mb-1 uppercase tracking-wider text-[11px]">
                  Executive Summary
                </h3>
                <p>{report.executive_summary}</p>
              </div>

              {/* 5-Pillar Evidence Taxonomy */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1.5 uppercase tracking-wider">
                  Transparent Evidence Taxonomy
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Observed Data */}
                  <div className="p-3.5 bg-blue-50/50 rounded-lg border border-blue-200">
                    <div className="font-bold text-blue-900 mb-2 flex items-center justify-between">
                      <span>1. OBSERVED DATA (Remote Sensing & Ground Monitoring)</span>
                      <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">Empirical</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {report.evidence_taxonomy.observed_data.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Research Evidence */}
                  <div className="p-3.5 bg-emerald-50/50 rounded-lg border border-emerald-200">
                    <div className="font-bold text-emerald-900 mb-2 flex items-center justify-between">
                      <span>2. RESEARCH EVIDENCE (Peer-Reviewed Findings)</span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">Validated</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {report.evidence_taxonomy.research_evidence.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Model Predictions */}
                  <div className="p-3.5 bg-amber-50/50 rounded-lg border border-amber-200">
                    <div className="font-bold text-amber-900 mb-2 flex items-center justify-between">
                      <span>3. MODEL PREDICTIONS (Ensemble Geospatial ML)</span>
                      <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">Probabilistic</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {report.evidence_taxonomy.model_predictions.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Scenario Estimates */}
                  <div className="p-3.5 bg-purple-50/50 rounded-lg border border-purple-200">
                    <div className="font-bold text-purple-900 mb-2 flex items-center justify-between">
                      <span>4. SCENARIO ESTIMATES (Multi-Objective Simulation)</span>
                      <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded">Simulated</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {report.evidence_taxonomy.scenario_estimates.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Statutory Assumptions */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <span className="font-bold text-slate-800 block mb-1">
                    5. STATUTORY ASSUMPTIONS & LEGAL CONSTRAINTS
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    {report.evidence_taxonomy.statutory_assumptions.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="p-4 bg-slate-900 text-white rounded-lg">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                  Actionable Policy & Governance Directives
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-200">
                  {report.actionable_policy_recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ol>
              </div>

              {/* Statutory Disclaimer */}
              <div className="p-3 border border-slate-200 rounded text-[11px] text-slate-500 bg-slate-50">
                <strong>Statutory Notice:</strong> {report.disclaimer}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
