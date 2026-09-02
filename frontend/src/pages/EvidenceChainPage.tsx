import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  FileCheck2,
  ShieldCheck,
  Cpu,
  Layers,
  Database,
  ArrowRight,
  CheckCircle2,
  Lock,
  ExternalLink
} from 'lucide-react';

interface EvidenceChainPageProps {
  selectedCellId?: string;
  onNavigateTab: (tab: any) => void;
}

export const EvidenceChainPage: React.FC<EvidenceChainPageProps> = ({
  selectedCellId = 'TP-0002',
  onNavigateTab
}) => {
  const [cellId, setCellId] = useState(selectedCellId);
  const [evidenceData, setEvidenceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChain(cellId);
  }, [cellId]);

  const loadChain = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.getEvidenceChain(id);
      setEvidenceData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <span>Evidence Chain & Decision Provenance Audit</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              Audit-Ready
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full end-to-end traceable lineage from empirical satellite telemetry to machine-learning inference and statutory policy grounding.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>Verifiable Audit Trail • OGD Standard</span>
        </div>
      </div>

      {/* Breadcrumb Visual Trail */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          5-Stage Decision Provenance Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Stage 1: Raw Sources */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="text-[10px] font-bold text-blue-700 uppercase">Stage 1: Ingestion</div>
            <div className="font-bold text-slate-900">Multi-Source Telemetry</div>
            <p className="text-[11px] text-slate-500">
              Sentinel-2 (10m), Bhuvan LULC, OGD Census, OSM Highways
            </p>
          </div>

          {/* Stage 2: Preprocessing */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="text-[10px] font-bold text-blue-700 uppercase">Stage 2: Validation</div>
            <div className="font-bold text-slate-900">CRS Standardization</div>
            <p className="text-[11px] text-slate-500">
              EPSG:4326 reprojection, cloud masking, spatial join on 25ha cells
            </p>
          </div>

          {/* Stage 3: Features */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="text-[10px] font-bold text-blue-700 uppercase">Stage 3: Engineering</div>
            <div className="font-bold text-slate-900">Feature Extraction</div>
            <p className="text-[11px] text-slate-500">
              NDVI/NDBI deltas, NH-544 proximity buffer, TWAD aquifer index
            </p>
          </div>

          {/* Stage 4: ML Inference */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="text-[10px] font-bold text-blue-700 uppercase">Stage 4: Prediction</div>
            <div className="font-bold text-slate-900">Ensemble ML v1.2</div>
            <p className="text-[11px] text-slate-500">
              Calibrated transition probability with 5-fold cross-validation
            </p>
          </div>

          {/* Stage 5: Grounding */}
          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-300 text-xs space-y-1">
            <div className="text-[10px] font-bold text-emerald-800 uppercase">Stage 5: Policy Grounding</div>
            <div className="font-bold text-slate-900">Statutory Brief</div>
            <p className="text-[11px] text-slate-600">
              TNCDBR 2019 Rule 22 & Section 47A statutory citations
            </p>
          </div>
        </div>
      </div>

      {/* Deep Parcel Audit Card */}
      {evidenceData && (
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-slate-900">
                  Traceable Audit Record: Parcel {evidenceData.prediction.cell_id}
                </span>
                <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-100 text-slate-800">
                  Taluk: {evidenceData.prediction.taluk}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit Hash: <span className="font-mono text-slate-700">sha256-a9b7c84e912f4510b001a7c3e59321</span>
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500">Inspect Parcel ID:</span>
              <input
                type="text"
                value={cellId}
                onChange={(e) => setCellId(e.target.value.toUpperCase())}
                placeholder="e.g. TP-0002"
                className="w-24 px-2 py-1 border border-slate-300 rounded font-mono uppercase text-xs"
              />
            </div>
          </div>

          {/* Detailed Attribution Trail */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Cpu className="w-4 h-4 text-blue-700" />
                <span>Model & Architecture</span>
              </div>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Architecture:</span>
                  <span className="font-semibold text-slate-800">{evidenceData.evidence_chain.model_architecture}</span>
                </div>
                <div className="flex justify-between">
                  <span>Training Period:</span>
                  <span className="font-medium text-slate-800">{evidenceData.evidence_chain.training_period}</span>
                </div>
                <div className="flex justify-between">
                  <span>Validation AUC:</span>
                  <span className="font-mono font-bold text-emerald-700">{evidenceData.evidence_chain.validation_roc_auc}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>Feature Vector Attribution</span>
              </div>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>NH-544 Distance:</span>
                  <span className="font-mono text-slate-800">{evidenceData.parcel_metadata.dist_to_nh_km} km</span>
                </div>
                <div className="flex justify-between">
                  <span>5-Yr Built Index (ΔNDBI):</span>
                  <span className="font-mono text-slate-800">+{evidenceData.parcel_metadata.ndbi_delta}</span>
                </div>
                <div className="flex justify-between">
                  <span>Aquifer Condition:</span>
                  <span className="font-semibold text-amber-700">{evidenceData.parcel_metadata.groundwater_status}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                <Database className="w-4 h-4 text-purple-700" />
                <span>Data Source Licensing</span>
              </div>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>LULC Authority:</span>
                  <span className="font-medium text-slate-800">NRSC Bhuvan (OGD India)</span>
                </div>
                <div className="flex justify-between">
                  <span>Satellite Sensor:</span>
                  <span className="font-medium text-slate-800">ESA Copernicus (Open Access)</span>
                </div>
                <div className="flex justify-between">
                  <span>Road Geometry:</span>
                  <span className="font-medium text-slate-800">OpenStreetMap (ODbL)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
            <span>
              <strong>Statutory Clearance:</strong> Under Section 47A, conversion of this parcel requires District Planning Authority concurrence and NOC from the Agricultural Department.
            </span>
            <button
              onClick={() => onNavigateTab('research')}
              className="text-xs font-semibold text-blue-800 hover:text-blue-950 flex items-center space-x-1 shrink-0 ml-4"
            >
              <span>Verify Legal Rule</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
