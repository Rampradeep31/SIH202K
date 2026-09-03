import React, { useState, useEffect } from 'react';
import { api, ApiForbiddenError } from '../services/api';
import { Workspace, UserRole } from '../types';
import { Users, Plus, MessageSquare, Lock, Send } from 'lucide-react';

const CAN_COLLABORATE: UserRole[] = ['Researcher', 'Government Analyst', 'Policymaker'];

interface WorkspacesPageProps {
  userRole: UserRole;
}

export const WorkspacesPage: React.FC<WorkspacesPageProps> = ({ userRole }) => {
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [noteText, setNoteText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canCollaborate = CAN_COLLABORATE.includes(userRole);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const res = await api.getWorkspaces();
      setWorkspaces(res.workspaces);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openWorkspace = async (id: string) => {
    setError(null);
    try {
      const ws = await api.getWorkspace(id);
      setActiveWorkspace(ws);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setError(null);
    try {
      const ws = await api.createWorkspace(newName.trim(), newDesc.trim());
      setNewName('');
      setNewDesc('');
      await loadWorkspaces();
      setActiveWorkspace(ws);
    } catch (err) {
      setError(err instanceof ApiForbiddenError ? err.message : 'Failed to create workspace.');
    }
  };

  const handleAddNote = async () => {
    if (!activeWorkspace || !noteText.trim() || !authorName.trim()) return;
    setError(null);
    try {
      await api.addWorkspaceNote(activeWorkspace.id, authorName.trim(), noteText.trim());
      setNoteText('');
      await openWorkspace(activeWorkspace.id);
      await loadWorkspaces();
    } catch (err) {
      setError(err instanceof ApiForbiddenError ? err.message : 'Failed to post note.');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-700" />
          <span>Collaborative Workspaces</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Shared, server-persisted workspaces — every viewer of this platform sees the same list and notes, not just
          your own browser. Creating a workspace or posting a note requires Researcher role or above.
        </p>
      </div>

      {!canCollaborate && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 flex items-center space-x-2">
          <Lock className="w-4 h-4 shrink-0 text-slate-400" />
          <span>You're viewing as <strong>{userRole}</strong> — switch to Researcher, Government Analyst, or Policymaker in Settings to create workspaces or post notes.</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Workspace List */}
        <div className="lg:col-span-1 space-y-3">
          {canCollaborate && (
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Plus className="w-4 h-4 text-blue-700" />
                <span>New Workspace</span>
              </h3>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Avinashi Corridor Review"
                className="w-full text-xs border border-slate-200 rounded px-2 py-1.5"
              />
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full text-xs border border-slate-200 rounded px-2 py-1.5"
              />
              <button
                onClick={handleCreate}
                className="w-full py-1.5 bg-blue-800 hover:bg-blue-900 text-white rounded-md font-semibold text-xs transition-colors"
              >
                Create Workspace
              </button>
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200 shadow-2xs">
            <div className="p-3 border-b border-slate-100 text-xs font-bold text-slate-900 uppercase tracking-wider">
              All Workspaces ({workspaces.length})
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {loading && <div className="p-3 text-xs text-slate-400">Loading…</div>}
              {!loading && workspaces.length === 0 && (
                <div className="p-3 text-xs text-slate-400">No workspaces yet — be the first to create one.</div>
              )}
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => openWorkspace(ws.id)}
                  className={`w-full text-left p-3 hover:bg-slate-50 transition-colors ${activeWorkspace?.id === ws.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="text-xs font-bold text-slate-900">{ws.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {ws.created_by_role} • {ws.note_count ?? ws.notes?.length ?? 0} notes
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Workspace Detail */}
        <div className="lg:col-span-2">
          {!activeWorkspace ? (
            <div className="h-full flex items-center justify-center bg-white rounded-lg border border-slate-200 border-dashed p-12 text-center text-xs text-slate-400">
              Select a workspace to view its shared notes.
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs">
              <div className="p-4 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">{activeWorkspace.name}</h2>
                {activeWorkspace.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{activeWorkspace.description}</p>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  Created by {activeWorkspace.created_by_role} • {new Date(activeWorkspace.created_at).toLocaleString()}
                </p>
              </div>

              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {activeWorkspace.notes.length === 0 && (
                  <div className="text-xs text-slate-400">No notes yet.</div>
                )}
                {activeWorkspace.notes.map((n) => (
                  <div key={n.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-bold text-slate-800">{n.author_name} <span className="font-normal text-slate-400">({n.author_role})</span></span>
                      <span>{new Date(n.posted_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-700">{n.text}</p>
                  </div>
                ))}
              </div>

              {canCollaborate && (
                <div className="p-4 border-t border-slate-100 space-y-2">
                  <input
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Your name"
                    className="w-full text-xs border border-slate-200 rounded px-2 py-1.5"
                  />
                  <div className="flex items-center space-x-2">
                    <input
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add a note…"
                      className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5"
                    />
                    <button
                      onClick={handleAddNote}
                      className="px-3 py-1.5 bg-blue-800 hover:bg-blue-900 text-white rounded-md font-semibold text-xs flex items-center space-x-1"
                    >
                      <Send className="w-3 h-3" />
                      <MessageSquare className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
