import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, KeyRound, PlusCircle, School, ShieldCheck, 
  Copy, Check, Search, ArrowRight, RefreshCw, Sparkles,
  Lock, Globe, UserCheck
} from 'lucide-react';
import groupService from '../services/groupService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  // Modals state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSchoolModal, setShowSchoolModal] = useState(false);

  // Form inputs
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    school_id: '',
    visibility: 'public'
  });
  const [creatingGroup, setCreatingGroup] = useState(false);

  const [newSchool, setNewSchool] = useState({
    name: '',
    code: '',
    description: '',
    address: ''
  });
  const [creatingSchool, setCreatingSchool] = useState(false);

  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [gRes, sRes] = await Promise.all([
        groupService.getGroups(),
        groupService.getSchools()
      ]);
      setGroups(gRes.data || []);
      setSchools(sRes.data || []);
    } catch (err) {
      showError(err.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showSuccess(`Copied group join code: ${code}`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleJoinWithCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      setJoining(true);
      const res = await groupService.joinGroupByCode(joinCode.trim());
      showSuccess(res.message || 'Joined group successfully!');
      setShowJoinModal(false);
      setJoinCode('');
      fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to join group. Please check the code.');
    } finally {
      setJoining(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.name.trim()) return;

    try {
      setCreatingGroup(true);
      const res = await groupService.createGroup({
        name: newGroup.name.trim(),
        description: newGroup.description.trim() || null,
        school_id: newGroup.school_id ? Number(newGroup.school_id) : null,
        visibility: newGroup.visibility
      });
      const created = res.data;
      showSuccess(`Group "${created.name}" created! Join code: ${created.code}`);
      setShowCreateModal(false);
      setNewGroup({ name: '', description: '', school_id: '', visibility: 'public' });
      fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleCreateSchool = async (e) => {
    e.preventDefault();
    if (!newSchool.name.trim()) return;

    try {
      setCreatingSchool(true);
      const res = await groupService.createSchool({
        name: newSchool.name.trim(),
        code: newSchool.code.trim() || null,
        description: newSchool.description.trim() || null,
        address: newSchool.address.trim() || null
      });
      showSuccess(`School "${res.data.name}" registered successfully!`);
      setShowSchoolModal(false);
      setNewSchool({ name: '', code: '', description: '', address: '' });
      fetchAll();
    } catch (err) {
      showError(err.message || 'Failed to register school');
    } finally {
      setCreatingSchool(false);
    }
  };

  const filteredGroups = groups.filter(g => {
    const s = search.toLowerCase();
    return g.name.toLowerCase().includes(s) ||
           (g.code && g.code.toLowerCase().includes(s)) ||
           (g.school_name && g.school_name.toLowerCase().includes(s)) ||
           (g.description && g.description.toLowerCase().includes(s));
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-slate-800 p-8 sm:p-10 overflow-hidden shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
            <Users className="w-3.5 h-3.5" />
            <span>Academic Groups & Institutions</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Classroom & School Groups
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Collaborate in school workspaces, share exams with class groups, and join instantly using shareable Join Codes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              if (!isAuthenticated) {
                showInfo('Please log in to join a group.');
                return;
              }
              setShowJoinModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-[0.98] transition-all shadow-md"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Enter Join Code</span>
          </button>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                showInfo('Please log in to create a group.');
                return;
              }
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all shadow-lg shadow-indigo-600/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Group</span>
          </button>

          {user && (user.role === 'admin' || user.role === 'teacher') && (
            <button
              onClick={() => setShowSchoolModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 active:scale-[0.98] transition-all"
            >
              <School className="w-4 h-4 text-emerald-400" />
              <span>Add School</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div className="text-sm font-semibold text-slate-300">
          Available Groups: <span className="text-indigo-400 font-mono">{filteredGroups.length}</span>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by group name, school, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading classroom groups...</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-16 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Groups Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Create a new group or enter a shareable join code from your teacher to get started.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
            >
              Enter Join Code
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => {
            const isOwner = group.my_role === 'owner';
            const isMember = Boolean(group.my_role);

            return (
              <div
                key={group.id}
                className="group bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1"
              >
                <div className="space-y-4">
                  {/* Header Badges */}
                  <div className="flex items-center justify-between gap-2">
                    {group.school_name ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 truncate max-w-[180px]">
                        <School className="w-3 h-3 shrink-0" />
                        <span className="truncate">{group.school_name}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                        Independent Group
                      </span>
                    )}

                    {group.my_role && (
                      <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {group.my_role}
                      </span>
                    )}
                  </div>

                  {/* Group Name & Description */}
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {group.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {group.description || 'Academic group workspace for examination schedules.'}
                    </p>
                  </div>

                  {/* Shareable Group Code Box */}
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        Shareable Join Code
                      </span>
                      <span className="text-sm font-mono font-bold text-amber-400 tracking-wider">
                        {group.code}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(group.code)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                      title="Copy code to share with students"
                    >
                      {copiedCode === group.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 text-[11px]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[11px]">Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Group Stats */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{group.member_count || 1} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {group.visibility === 'public' ? (
                        <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span className="capitalize">{group.visibility}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-5">
                  <Link
                    to={`/groups/${group.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 active:scale-[0.98] transition-all"
                  >
                    <span>View Group & Class Members</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL: JOIN GROUP VIA CODE ================= */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Join Group with Code</h3>
                <p className="text-xs text-slate-400">Enter the group code provided by your instructor.</p>
              </div>
            </div>

            <form onSubmit={handleJoinWithCode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Group Join Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GRP-CS401"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono text-center font-bold tracking-widest text-lg focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joining || !joinCode.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/30"
                >
                  {joining ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE GROUP ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Create New Group</h3>
                <p className="text-xs text-slate-400">A shareable join code will be generated automatically.</p>
              </div>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Group Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 11 Mathematics & Statistics"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  School / Institutional Affiliation
                </label>
                <select
                  value={newGroup.school_id}
                  onChange={(e) => setNewGroup({ ...newGroup, school_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 text-sm"
                >
                  <option value="">-- Independent (No specific school) --</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description / Topic
                </label>
                <textarea
                  rows="2"
                  placeholder="Class announcements, study scope, and group exam policies..."
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup || !newGroup.name.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-600/30"
                >
                  {creatingGroup ? 'Creating...' : 'Create & Generate Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REGISTER SCHOOL ================= */}
      {showSchoolModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <School className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Register School / Institution</h3>
                <p className="text-xs text-slate-400">Add an academic department or educational institution.</p>
              </div>
            </div>

            <form onSubmit={handleCreateSchool} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  School Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Greenfield University"
                  value={newSchool.name}
                  onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  School Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SCH-GFU01 (Auto-generated if blank)"
                  value={newSchool.code}
                  onChange={(e) => setNewSchool({ ...newSchool, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Address / Campus
                </label>
                <input
                  type="text"
                  placeholder="e.g. Central Campus, Block 4"
                  value={newSchool.address}
                  onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSchoolModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingSchool || !newSchool.name.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-md shadow-emerald-600/30"
                >
                  {creatingSchool ? 'Registering...' : 'Register School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
