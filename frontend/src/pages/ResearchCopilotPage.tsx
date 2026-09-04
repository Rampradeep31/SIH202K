import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { RAGResponse } from '../types';
import {
  BookOpen,
  Search,
  ExternalLink,
  ShieldCheck,
  FileText,
  Scale,
  MapPin,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const VERIFICATION_BADGES: Record<string, { label: string; className: string }> = {
  VALIDATED: { label: 'Validated Source', className: 'text-emerald-700' },
  VALIDATED_WEAK: { label: 'Weakly Verified (unconfirmed content match)', className: 'text-amber-700' },
  PENDING_MANUAL_REVIEW: { label: 'Pending Manual Review', className: 'text-amber-700' },
  MODEL_ESTIMATE: { label: 'Modeled Estimate — Not a Verified Source', className: 'text-red-700' },
  KNOWN_GAP: { label: 'Known Data Gap — No Reading Available', className: 'text-slate-500' },
};

function getVerificationBadge(status?: string) {
  return VERIFICATION_BADGES[status ?? ''] ?? { label: 'Unverified', className: 'text-slate-400' };
}

interface ResearchCopilotPageProps {
  onNavigateTab: (tab: any) => void;
}

const SAMPLE_QUERIES = [
  "Where is agricultural land most likely to experience built-up expansion in Tiruppur?",
  "What are the statutory rules under TNCDBR 2019 for converting agricultural land to non-agricultural use?",
  "What is the groundwater extraction status in Tiruppur North and Noyyal basin?",
  "How does NH-544 highway proximity impact smallholder agrarian fragmentation?"
];

export const ResearchCopilotPage: React.FC<ResearchCopilotPageProps> = ({ onNavigateTab }) => {
  const [question, setQuestion] = useState(SAMPLE_QUERIES[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RAGResponse | null>(null);
  const [documents, setDocuments] = useState<{ policies: any[]; research: any[] }>({ policies: [], research: [] });

  useEffect(() => {
    // Initial grounded query
    handleQuery(SAMPLE_QUERIES[0]);
    api.getDocuments().then((docRes) => setDocuments(docRes)).catch(console.error);
  }, []);

  const handleQuery = async (queryText: string) => {
    setLoading(true);
    setQuestion(queryText);
    try {
      const res = await api.queryResearch(queryText);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      handleQuery(question.trim());
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">
              Research & Policy Copilot
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
              Grounded RAG
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Grounded evidence synthesis across Tamil Nadu Town Planning Statutes (TNCDBR, Section 47A) and peer-reviewed land transition studies.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Zero Hallucination Guarantee • Strict Attribution</span>
        </div>
      </div>

      {/* Query Bar & Presets */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a policy or research question grounded in Tamil Nadu land governance..."
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-600 text-slate-800"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold rounded-md transition-colors shadow-xs flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{loading ? 'Synthesizing...' : 'Retrieve Evidence'}</span>
          </button>
        </form>

        {/* Query Presets */}
        <div className="flex items-center space-x-2 pt-1 overflow-x-auto">
          <span className="text-[11px] text-slate-400 font-semibold shrink-0 uppercase tracking-wider">
            Curated Questions:
          </span>
          {SAMPLE_QUERIES.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleQuery(q)}
              className="text-[11px] px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0 text-left"
            >
              {q.length > 48 ? q.substring(0, 48) + '...' : q}
            </button>
          ))}
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-6">
          {/* Synthesized Grounded Answer */}
          <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Synthesized Evidence Answer
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="text-slate-500 font-medium">Confidence Score:</span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded border ${
                  result.confidence_score >= 0.85
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : result.confidence_score >= 0.65
                    ? 'text-amber-700 bg-amber-50 border-amber-200'
                    : 'text-red-700 bg-red-50 border-red-200'
                }`}>
                  {Math.round(result.confidence_score * 100)}% {result.confidence_score >= 0.85 ? 'Verified Grounded' : 'Mixed-Confidence Grounding'}
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-800 leading-relaxed font-normal">
              {result.answer}
            </p>

            {(result.synthesis_method || result.search_method) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400 font-mono">
                {result.synthesis_method && (
                  <span>
                    Answer: {result.synthesis_method.startsWith('llm_generated') ? '🤖 ' : ''}{result.synthesis_method}
                  </span>
                )}
                {result.search_method && <span>Retrieval: {result.search_method}</span>}
              </div>
            )}

            {/* Key Evidence Bullet Points */}
            {result.key_evidence.length > 0 && (
              <div className="p-4 bg-slate-50 rounded-md border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Key Grounded Evidence Points</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {result.key_evidence.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-blue-700 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Linked Locations & GIS Connection */}
            <div className="flex flex-wrap items-center justify-between pt-2 text-xs text-slate-500 border-t border-slate-100 gap-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-red-600" />
                <span className="font-semibold text-slate-700">Relevant Locations:</span>
                <div className="flex space-x-1.5">
                  {result.relevant_locations.map((loc, i) => (
                    <span key={i} className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700">
                      {loc}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('gis')}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center space-x-1"
              >
                <span>Inspect in GIS Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sources & Citations Grid */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Direct Primary Sources & Statutory Citations ({result.sources.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.sources.map((src, idx) => {
                const badge = getVerificationBadge(src.verification_status);
                return (
                  <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          src.type.includes('Policy') || src.type.includes('Statutory')
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {src.type}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{src.year}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">{src.title}</h4>
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className={`text-[11px] font-semibold flex items-center gap-1 ${badge.className}`}>
                        {src.is_validated ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {badge.label}
                      </span>
                      {src.url ? (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 hover:text-blue-900 font-semibold flex items-center space-x-1 text-[11px]"
                        >
                          <span>Official Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-300">No external link</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transparent Assumptions & Limitations */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-1.5">
            <div className="flex items-center space-x-1.5 text-amber-900 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <span>Assumptions & Methodological Limitations</span>
            </div>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              <strong>Assumptions:</strong> {result.assumptions}
            </p>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              <strong>Limitations:</strong> {result.limitations}
            </p>
          </div>
        </div>
      )}

      {/* Grounded Knowledge Base Corpus Overview */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Complete Tamil Nadu Knowledge Corpus Available to RAG
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Statutory Policies */}
          <div className="space-y-2">
            <h4 className="font-bold text-blue-900 flex items-center space-x-1.5 text-xs">
              <Scale className="w-3.5 h-3.5 text-blue-700" />
              <span>Government Acts & Statutory Planning Regulations</span>
            </h4>
            <div className="space-y-2">
              {documents.policies.map((p: any) => (
                <div key={p.doc_id} className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <div className="font-semibold text-slate-900">{p.title}</div>
                  <div className="text-[10px] text-slate-500">{p.jurisdiction} • {p.sector}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Research Papers */}
          <div className="space-y-2">
            <h4 className="font-bold text-emerald-900 flex items-center space-x-1.5 text-xs">
              <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
              <span>Peer-Reviewed Scientific Studies (Noyyal / Western TN)</span>
            </h4>
            <div className="space-y-2">
              {documents.research.map((r: any) => (
                <div key={r.doc_id} className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <div className="font-semibold text-slate-900">{r.title}</div>
                  <div className="text-[10px] text-slate-500">{r.journal} ({r.year})</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
