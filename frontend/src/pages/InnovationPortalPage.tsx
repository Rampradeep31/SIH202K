import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { InnovationProgramme, UserRole } from '../types';
import { Rocket, ExternalLink, Info, Lock, Sparkles, ClipboardList } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  'Hackathon': 'bg-blue-100 text-blue-800',
  'Policy Programme': 'bg-emerald-100 text-emerald-800',
  'Pilot Scheme': 'bg-amber-100 text-amber-800',
  'Grant / Commercialization': 'bg-purple-100 text-purple-800',
  'Startup Accelerator': 'bg-purple-100 text-purple-800',
  'Policy Framework': 'bg-slate-200 text-slate-800'
};

const CAN_SUBMIT_ROLES: UserRole[] = ['Researcher', 'Government Analyst', 'Policymaker'];

interface InnovationPortalPageProps {
  userRole: UserRole;
}

export const InnovationPortalPage: React.FC<InnovationPortalPageProps> = ({ userRole }) => {
  const [loading, setLoading] = useState(true);
  const [programmes, setProgrammes] = useState<InnovationProgramme[]>([]);
  const [pilotProjects, setPilotProjects] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [focusDistrict, setFocusDistrict] = useState('');
  const [organization, setOrganization] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSubmit = CAN_SUBMIT_ROLES.includes(userRole);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [progRes, pilotRes] = await Promise.all([
        api.getInnovationProgrammes(),
        api.getPilotProjects()
      ]);
      setProgrammes(progRes.programmes);
      setPilotProjects(pilotRes.pilot_projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !title.trim() || !description.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.submitPilotProject(title.trim(), description.trim(), focusDistrict.trim() || undefined, organization.trim() || undefined);
      setTitle('');
      setDescription('');
      setFocusDistrict('');
      setOrganization('');
      const pilotRes = await api.getPilotProjects();
      setPilotProjects(pilotRes.pilot_projects);
    } catch (err) {
      console.error(err);
      setSubmitError('Could not submit — check that the backend is running.');
    } finally {
      setSubmitting(false);
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
          The programmes below are a curated external directory — click "Official Source" to visit the programme's
          own site for current application windows. This platform's own pilot-project tracker is below that.
        </span>
      </div>

      {/* Pilot Project Tracker — genuinely persisted, not just a static list */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2">
          <ClipboardList className="w-4 h-4 text-blue-700" />
          <h2 className="text-sm font-bold text-slate-900">Submit a Pilot Project</h2>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">Live Tracker</span>
        </div>

        {!canSubmit && (
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-center space-x-2">
            <Lock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span>Viewing as <strong>{userRole}</strong> — submitting a pilot project requires Researcher, Government Analyst, or Policymaker role.</span>
          </div>
        )}

        <form onSubmit={handleSubmitPilot} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canSubmit}
            placeholder="Pilot project title"
            className="text-xs border border-slate-300 rounded-md p-2.5 focus:outline-hidden focus:ring-1 focus:ring-blue-600 disabled:opacity-50 disabled:bg-slate-50 md:col-span-2"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canSubmit}
            placeholder="What does this pilot do, and what problem does it address?"
            rows={3}
            className="text-xs border border-slate-300 rounded-md p-2.5 focus:outline-hidden focus:ring-1 focus:ring-blue-600 disabled:opacity-50 disabled:bg-slate-50 md:col-span-2"
          />
          <input
            value={focusDistrict}
            onChange={(e) => setFocusDistrict(e.target.value)}
            disabled={!canSubmit}
            placeholder="Focus district (optional)"
            className="text-xs border border-slate-300 rounded-md p-2.5 focus:outline-hidden focus:ring-1 focus:ring-blue-600 disabled:opacity-50 disabled:bg-slate-50"
          />
          <input
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            disabled={!canSubmit}
            placeholder="Proposing organization (optional)"
            className="text-xs border border-slate-300 rounded-md p-2.5 focus:outline-hidden focus:ring-1 focus:ring-blue-600 disabled:opacity-50 disabled:bg-slate-50"
          />
          <button
            type="submit"
            disabled={!canSubmit || !title.trim() || !description.trim() || submitting}
            className="md:col-span-2 px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold rounded-md shadow-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 w-fit"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{submitting ? 'Submitting…' : 'Submit Pilot Project'}</span>
          </button>
        </form>
        {submitError && <p className="text-xs text-red-600">{submitError}</p>}

        {pilotProjects.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {pilotProjects.length} Submitted Pilot Project{pilotProjects.length !== 1 ? 's' : ''}
            </h3>
            {pilotProjects.map((p) => (
              <div key={p.id} className="p-3 bg-slate-50 rounded-md border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-slate-900">{p.title}</span>
                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">{p.status}</span>
                </div>
                <p className="text-xs text-slate-600">{p.description}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {[p.focus_district, p.proposing_organization, `submitted by ${p.submitted_by_role}`].filter(Boolean).join(' • ')}
                </p>
              </div>
            ))}
          </div>
        )}
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
