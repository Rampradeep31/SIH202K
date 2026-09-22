import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Library, Search, ExternalLink, ScrollText, FlaskConical, Landmark } from 'lucide-react';

type DocType = 'Policy' | 'Research' | 'Grounding Fact';

interface RepoDoc {
  id: string;
  type: DocType;
  title: string;
  subtitle: string;
  year?: number;
  verification_status?: string;
  source_url?: string;
}

const TYPE_META: Record<DocType, { icon: React.ReactNode; className: string }> = {
  'Policy': { icon: <Landmark className="w-3.5 h-3.5" />, className: 'bg-blue-100 text-blue-800' },
  'Research': { icon: <FlaskConical className="w-3.5 h-3.5" />, className: 'bg-emerald-100 text-emerald-800' },
  'Grounding Fact': { icon: <ScrollText className="w-3.5 h-3.5" />, className: 'bg-slate-200 text-slate-700' },
};

export const RepositoryPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<RepoDoc[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | DocType>('All');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getDocuments();
      const all: RepoDoc[] = [
        ...res.policies.map((p: any): RepoDoc => ({
          id: p.doc_id,
          type: 'Policy',
          title: p.title,
          subtitle: p.jurisdiction || p.sector || '',
          year: p.year,
          verification_status: p.verification_status,
          source_url: p.source_url,
        })),
        ...res.research.map((r: any): RepoDoc => ({
          id: r.doc_id,
          type: 'Research',
          title: r.title,
          subtitle: r.authors || r.journal || '',
          year: r.year,
          verification_status: r.verification_status,
          source_url: r.source_url,
        })),
        ...(res.grounding_facts || []).map((f: any, idx: number): RepoDoc => ({
          id: f.fact_id || `fact-${idx}`,
          type: 'Grounding Fact',
          title: f.statement,
          subtitle: [f.category, f.district].filter(Boolean).join(' • '),
          verification_status: f.verified ? 'VALIDATED' : 'PENDING_MANUAL_REVIEW',
          source_url: f.source_url,
        })),
      ];
      setDocs(all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docs.filter((d) => {
      if (typeFilter !== 'All' && d.type !== typeFilter) return false;
      if (q && !d.title.toLowerCase().includes(q) && !d.subtitle.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [docs, search, typeFilter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: docs.length, Policy: 0, Research: 0, 'Grounding Fact': 0 };
    docs.forEach((d) => { c[d.type] = (c[d.type] || 0) + 1; });
    return c;
  }, [docs]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Library className="w-5 h-5 text-blue-700" />
          <span>Document Repository</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Every statutory policy, peer-reviewed paper, and grounding fact in the knowledge base, in one searchable
          list — the same corpus the Research Copilot draws on, browsable directly instead of only through a query.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles, authors, districts…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['All', 'Policy', 'Research', 'Grounding Fact'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                typeFilter === t
                  ? 'bg-blue-800 text-white border-blue-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t} ({counts[t] ?? 0})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading repository…</div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-3 border-b border-slate-100 text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
            <span>{filtered.length} of {docs.length} documents</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {filtered.map((d) => {
              const meta = TYPE_META[d.type];
              return (
                <div key={`${d.type}-${d.id}`} className="p-3.5 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${meta.className}`}>
                        {meta.icon}
                        {d.type}
                      </span>
                      {d.year && <span className="text-[10px] font-mono text-slate-400">{d.year}</span>}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 leading-snug">{d.title}</div>
                    {d.subtitle && <div className="text-xs text-slate-500 mt-0.5">{d.subtitle}</div>}
                  </div>
                  {d.source_url && (
                    <a
                      href={d.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-blue-700 hover:text-blue-900 mt-1"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-400">No documents match this filter.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
