import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { InnovationProgramme } from '../types';
import { Rocket, ExternalLink, Info } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  'Hackathon': 'bg-blue-100 text-blue-800',
  'Policy Programme': 'bg-emerald-100 text-emerald-800',
  'Pilot Scheme': 'bg-amber-100 text-amber-800',
  'Grant / Commercialization': 'bg-purple-100 text-purple-800',
  'Startup Accelerator': 'bg-purple-100 text-purple-800',
  'Policy Framework': 'bg-slate-200 text-slate-800'
};

export const InnovationPortalPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [programmes, setProgrammes] = useState<InnovationProgramme[]>([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getInnovationProgrammes();
      setProgrammes(res.programmes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Rocket className="w-5 h-5 text-blue-700" />
          <span>Innovation Portal</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real, independently verifiable national hackathons, grants, and pilot programmes relevant to land governance
          and geospatial innovation — each links to its official source.
        </p>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start space-x-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          This is a curated directory, not an application system — click "Official Source" on any card to visit the
          programme's own site for current application windows and eligibility.
        </span>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading programmes…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programmes.map((p) => (
            <div key={p.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${TYPE_COLORS[p.type] || 'bg-slate-100 text-slate-700'}`}>
                    {p.type}
                  </span>
                  <span className="text-[10px] text-slate-400">{p.status}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1">{p.name}</h3>
                <p className="text-[11px] text-slate-500 mb-2">{p.organizer}</p>
                <p className="text-xs text-slate-700 leading-relaxed mb-2">{p.description}</p>
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                  {p.focus_area}
                </span>
              </div>
              <a
                href={p.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 pt-2 border-t border-slate-100 text-blue-700 hover:text-blue-900 font-semibold flex items-center space-x-1 text-[11px]"
              >
                <span>Official Source</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
