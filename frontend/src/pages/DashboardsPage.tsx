import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  DisputeStats,
  ClimateMetrics,
  ScenarioItem,
  KeyTransitionItem
} from '../types';
import {
  BarChart3,
  BookOpen,
  ShieldCheck,
  TrendingUp,
  CloudRain,
  Gavel,
  Target,
  Map as MapIcon,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

const CardShell: React.FC<{ title: string; icon: React.ReactNode; badge?: string; children: React.ReactNode }> = ({ title, icon, badge, children }) => (
  <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
        {icon}
        <span>{title}</span>
      </h3>
      {badge && <span className="text-[10px] font-mono text-slate-400">{badge}</span>}
    </div>
    <div className="flex-1">{children}</div>
  </div>
);

export const DashboardsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [docCounts, setDocCounts] = useState({ policies: 0, research: 0, facts: 0, total: 0 });
  const [sourceCoverage, setSourceCoverage] = useState({ policiesWithSource: 0, researchWithSource: 0 });
  const [keyTransitions, setKeyTransitions] = useState<KeyTransitionItem[]>([]);
  const [climate, setClimate] = useState<ClimateMetrics | null>(null);
  const [disputes, setDisputes] = useState<DisputeStats | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [geoInsights, setGeoInsights] = useState({ districts: 0, taluks: 0, layers: 0 });

  const [lulcDistricts, setLulcDistricts] = useState<string[]>([]);
  const [lulcDistrict, setLulcDistrict] = useState('Tiruppur');
  const [lulcLoading, setLulcLoading] = useState(false);

  useEffect(() => {
    loadAll();
    api.getLulcDistricts().then((res) => setLulcDistricts(res.available_districts)).catch(console.error);
  }, []);

  useEffect(() => {
    setLulcLoading(true);
    api.getLulcChange(lulcDistrict)
      .then((res) => setKeyTransitions(res.key_transitions || []))
      .catch(() => setKeyTransitions([]))
      .finally(() => setLulcLoading(false));
  }, [lulcDistrict]);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [docs, climateRes, disputeRes, scenarioRes, regions, gisLayers] = await Promise.allSettled([
        api.getDocuments(),
        api.getClimateMetrics(),
        api.getDisputeStats(),
        api.getScenarios(),
        api.getRegions(),
        api.getGisLayers()
      ]);

      if (docs.status === 'fulfilled') {
        const policies = docs.value.policies || [];
        const research = docs.value.research || [];
        setDocCounts({
          policies: policies.length,
          research: research.length,
          facts: docs.value.total_documents - policies.length - research.length,
          total: docs.value.total_documents
        });
        setSourceCoverage({
          policiesWithSource: policies.filter((p: any) => !!p.source_url).length,
          researchWithSource: research.filter((r: any) => !!r.source_url).length
        });
      }

      if (climateRes.status === 'fulfilled') setClimate(climateRes.value);
      if (disputeRes.status === 'fulfilled') setDisputes(disputeRes.value);
      if (scenarioRes.status === 'fulfilled') setScenarios(scenarioRes.value.scenarios || []);

      const districts = regions.status === 'fulfilled' ? regions.value.total_districts : 0;
      const taluks = regions.status === 'fulfilled' ? (regions.value.pilot_taluks || []).length : 0;
      const layers = gisLayers.status === 'fulfilled' ? (gisLayers.value.available_layers || []).length : 0;
      setGeoInsights({ districts, taluks, layers });
    } catch (err) {
      console.error(err);
      setError('Some dashboard widgets failed to load — check that the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Loading consolidated dashboards…</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-blue-700" />
          <span>Consolidated Dashboards</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          The 7 required indicator groups in one view: research outputs, policy performance, land use trends,
          climate resilience, land dispute statistics, project outcomes, and geospatial insights.
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Scope varies by card: some aggregate all 38 Tamil Nadu districts, others are scoped to the Tiruppur
          pilot only — each card's badge states which. Land Use Trends can be switched to any of the
          {lulcDistricts.length > 0 ? ` ${lulcDistricts.length} districts with parcel data` : ' available districts'}.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Research Outputs */}
        <CardShell title="Research Outputs" icon={<BookOpen className="w-4 h-4 text-blue-700" />} badge="Statewide Corpus">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xl font-black text-slate-900">{docCounts.policies}</div>
              <div className="text-[10px] text-slate-500">Statutory Policies</div>
            </div>
            <div>
              <div className="text-xl font-black text-slate-900">{docCounts.research}</div>
              <div className="text-[10px] text-slate-500">Research Papers</div>
            </div>
            <div>
              <div className="text-xl font-black text-slate-900">{docCounts.facts}</div>
              <div className="text-[10px] text-slate-500">Grounding Facts</div>
            </div>
          </div>
        </CardShell>

        {/* 2. Source Coverage */}
        <CardShell title="Source Coverage" icon={<ShieldCheck className="w-4 h-4 text-blue-700" />} badge="Statewide Corpus">
          <p className="text-[10px] text-slate-400 mb-2">
            Every statutory policy and research paper in the corpus links to its public source document.
          </p>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-xl font-black text-slate-900">{sourceCoverage.policiesWithSource}/{docCounts.policies}</div>
              <div className="text-[10px] text-slate-500">Statutory Policies Cited</div>
            </div>
            <div>
              <div className="text-xl font-black text-slate-900">{sourceCoverage.researchWithSource}/{docCounts.research}</div>
              <div className="text-[10px] text-slate-500">Research Papers Cited</div>
            </div>
          </div>
        </CardShell>

        {/* 3. Land Use Trends */}
        <CardShell title="Land Use Trends" icon={<TrendingUp className="w-4 h-4 text-blue-700" />} badge={`${lulcDistrict} • ha, 2018→2023`}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className="text-[10px] text-slate-400 flex-1">
              Land area (hectares) that moved between classes vs. area that stayed unchanged — modeled conversion
              labels, not a satellite classification. Pick a district to switch.
            </p>
            <select
              value={lulcDistrict}
              onChange={(e) => setLulcDistrict(e.target.value)}
              className="text-[10px] border border-slate-200 rounded px-1.5 py-1 shrink-0 bg-white"
            >
              {(lulcDistricts.length > 0 ? lulcDistricts : ['Tiruppur']).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="h-40 relative">
            {lulcLoading && (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400 bg-white/60">
                Loading {lulcDistrict}…
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={keyTransitions.slice(0, 5)} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="transition"
                  tick={{ fontSize: 9 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                  tickFormatter={(v: string) => (v.length > 22 ? `${v.slice(0, 20)}…` : v)}
                />
                <YAxis tick={{ fontSize: 10 }} label={{ value: 'ha', angle: -90, position: 'insideLeft', fontSize: 10, dx: 15 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [`${v.toLocaleString()} ha`, 'Area']} />
                <Bar dataKey="area_ha" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardShell>

        {/* 4. Climate Resilience Metrics */}
        <CardShell title="Climate Resilience Metrics" icon={<CloudRain className="w-4 h-4 text-blue-700" />} badge="Tamil Nadu Statewide">
          {climate ? (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400">
                Tamil Nadu state-level rainfall (IMD does not publish this series broken out by district) — how
                much rain falls in an average year, and whether the last decade has trended wetter or drier than
                the long-term historical average.
              </p>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <div className="text-lg font-black text-slate-900">{climate.long_term_annual_avg_mm} mm</div>
                  <div className="text-[10px] text-slate-500">Long-term Annual Avg Rainfall</div>
                </div>
                <div>
                  <div className={`text-lg font-black ${climate.recent_vs_baseline_pct_change >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                    {climate.recent_vs_baseline_pct_change > 0 ? '+' : ''}{climate.recent_vs_baseline_pct_change}%
                  </div>
                  <div className="text-[10px] text-slate-500">Recent Decade Rainfall vs. Long-term Avg</div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Coverage: {climate.coverage}</p>
            </div>
          ) : (
            <div className="text-xs text-slate-400">Climate data unavailable.</div>
          )}
        </CardShell>

        {/* 5. Land Dispute Statistics */}
        <CardShell title="Land Dispute Statistics" icon={<Gavel className="w-4 h-4 text-blue-700" />} badge="Synthetic — All 32 Districts">
          {disputes ? (
            <div className="space-y-2">
              <p className="text-[10px] text-slate-400">
                Modeled distribution of land-dispute case types across Tamil Nadu's 32 districts — not a feed from
                actual court records — showing what share of cases are still unresolved and what they're about.
              </p>
              <div className="grid grid-cols-2 gap-2 text-center mb-2">
                <div>
                  <div className="text-lg font-black text-slate-900">{disputes.total_cases.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500">Total Cases (32 districts)</div>
                </div>
                <div>
                  <div className="text-lg font-black text-amber-700">{disputes.pending_case_rate_pct}%</div>
                  <div className="text-[10px] text-slate-500">Still Pending / Unresolved</div>
                </div>
              </div>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={disputes.by_type} margin={{ top: 0, right: 10, left: -20, bottom: 0 }} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 9 }} />
                    <YAxis type="category" dataKey="dispute_type" tick={{ fontSize: 8 }} width={110} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="count" fill="#b45309" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {disputes.top_districts && disputes.top_districts.length > 0 && (
                <div className="pt-1 border-t border-slate-100">
                  <div className="text-[10px] font-semibold text-slate-500 mb-1">Highest case counts by district:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {disputes.top_districts.slice(0, 5).map((d) => (
                      <span key={d.district} className="text-[10px] bg-slate-100 rounded px-1.5 py-0.5">
                        {d.district}: <span className="font-bold">{d.count.toLocaleString()}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-400">Dispute data unavailable.</div>
          )}
        </CardShell>

        {/* 6. Policy Scenario Comparison */}
        <CardShell title="Policy Scenario Comparison" icon={<Target className="w-4 h-4 text-blue-700" />} badge="Tiruppur Pilot Only">
          <p className="text-[10px] text-slate-400 mb-2">
            Decision-support scores from the Scenario Simulator (0-100, higher is better) — these 3 fixed
            scenarios are built from Tiruppur-specific assumptions (NH-544, Noyyal basin, Palladam) and aren't
            yet available for other districts. No policy shown here has actually been enacted; use the Scenarios
            page's "Test Your Own Policy" tool to score a custom proposal for any district.
          </p>
          <div className="space-y-2">
            {scenarios.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 truncate pr-2">{s.name}</span>
                <span className="font-bold text-slate-900 shrink-0">{s.scoring.overall_score}/100</span>
              </div>
            ))}
            {scenarios.length === 0 && <div className="text-xs text-slate-400">No scenario data.</div>}
          </div>
        </CardShell>

        {/* 7. Geospatial Insights */}
        <CardShell title="Geospatial Insights" icon={<MapIcon className="w-4 h-4 text-blue-700" />} badge="Tamil Nadu Statewide">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xl font-black text-slate-900">{geoInsights.districts}</div>
              <div className="text-[10px] text-slate-500">Districts (TN)</div>
            </div>
            <div>
              <div className="text-xl font-black text-slate-900">{geoInsights.taluks}</div>
              <div className="text-[10px] text-slate-500">Pilot Taluks</div>
            </div>
            <div>
              <div className="text-xl font-black text-slate-900">{geoInsights.layers}</div>
              <div className="text-[10px] text-slate-500">GIS Layers</div>
            </div>
          </div>
        </CardShell>
      </div>
    </div>
  );
};
