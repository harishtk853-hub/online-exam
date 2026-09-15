import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Users, GraduationCap, Briefcase, CheckCircle2, 
  XCircle, Clock, AlertCircle, Search, Filter, RefreshCw,
  TrendingUp, Award, BookOpen, MessageSquare, ShieldAlert,
  ChevronRight, ArrowUpRight, Check, X, UserCheck, UserX,
  Activity, BarChart3, Lock, Eye, Building2, FileText, Download,
  ExternalLink, Image as ImageIcon
} from 'lucide-react';
import adminService from '../services/adminService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('teachers'); // 'teachers' | 'users' | 'analytics'

  // User Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Teacher Document Preview & Modal States
  const [previewingTeacher, setPreviewingTeacher] = useState(null);
  const [rejectModalTeacher, setRejectModalTeacher] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Action in progress tracking
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Check admin role
  useEffect(() => {
    if (user && user.role !== 'admin') {
      showError('Access denied: Administrator privileges required.');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        adminService.getStats(),
        adminService.listUsers()
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data || []);
    } catch (err) {
      showError(err.message || 'Failed to load administrator dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const params = {};
      if (selectedRoleFilter !== 'all') params.role = selectedRoleFilter;
      if (selectedStatusFilter !== 'all') params.status = selectedStatusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await adminService.listUsers(params);
      setUsers(res.data || []);
    } catch (err) {
      showError(err.message || 'Failed to refresh user list');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedRoleFilter, selectedStatusFilter]);

  const handleToggleTeacherVerification = async (targetUser, isApproved = true, notes = null) => {
    try {
      setActionLoadingId(targetUser.id);
      await adminService.setTeacherVerification(targetUser.id, {
        is_verified_teacher: isApproved,
        verification_status: isApproved ? 'verified' : 'rejected',
        verification_notes: notes
      });

      showSuccess(
        isApproved 
          ? `Verified ${targetUser.name} as certified faculty member.` 
          : `Verification for ${targetUser.name} has been rejected.`
      );

      // Update local state
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { 
        ...u, 
        is_verified_teacher: isApproved,
        verification_status: isApproved ? 'verified' : 'rejected',
        verification_notes: notes
      } : u));

      if (previewingTeacher && previewingTeacher.id === targetUser.id) {
        setPreviewingTeacher(prev => ({
          ...prev,
          is_verified_teacher: isApproved,
          verification_status: isApproved ? 'verified' : 'rejected',
          verification_notes: notes
        }));
      }

      setRejectModalTeacher(null);
      setRejectReason('');

      // Refresh stats
      const statsRes = await adminService.getStats();
      setStats(statsRes.data);
    } catch (err) {
      showError(err.message || 'Failed to update teacher verification');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    const newStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    const confirmMsg = targetUser.status === 'active'
      ? `Are you sure you want to SUSPEND ${targetUser.name}? They will lose platform access.`
      : `Re-activate ${targetUser.name}'s account?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setActionLoadingId(targetUser.id);
      await adminService.setUserStatus(targetUser.id, newStatus);
      showSuccess(`User ${targetUser.name} is now ${newStatus}.`);
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, status: newStatus } : u));
    } catch (err) {
      showError(err.message || 'Failed to update account status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser.role === newRole) return;
    try {
      setActionLoadingId(targetUser.id);
      await adminService.setUserRole(targetUser.id, newRole);
      showSuccess(`Changed ${targetUser.name}'s role to ${newRole.toUpperCase()}.`);
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
      const statsRes = await adminService.getStats();
      setStats(statsRes.data);
    } catch (err) {
      showError(err.message || 'Failed to update user role');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-10 h-10 text-purple-500 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Loading Institutional Administrator Console...</p>
      </div>
    );
  }

  const teachersList = users.filter(u => u.role === 'teacher');
  const pendingTeachersCount = teachersList.filter(t => !t.is_verified_teacher).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Super Administrator Portal</span>
              </span>
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                <Activity className="w-3 h-3" />
                <span>System Operational</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Institutional Command Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Real-time audit of platform accounts, user login metrics, faculty credentials verification, and exam integrity oversight.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Users & Logins */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Accounts</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">
              {stats?.users?.total || users.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-indigo-400 font-semibold">{stats?.users?.total_logins || 0}</span>
              <span>total session logins tracked</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Students: <b className="text-slate-200">{stats?.users?.students || 0}</b></span>
            <span>Teachers: <b className="text-slate-200">{stats?.users?.teachers || 0}</b></span>
          </div>
        </div>

        {/* Card 2: Teacher Verification Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Teacher Verifications</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white flex items-center gap-2">
              <span>{stats?.users?.verified_teachers || 0}</span>
              <span className="text-xs font-semibold text-emerald-400 font-sans px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                Verified
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats?.users?.pending_teachers || pendingTeachersCount > 0 ? (
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{stats?.users?.pending_teachers || pendingTeachersCount} teacher(s) need review</span>
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold">All faculty certified</span>
              )}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Staff total: <b className="text-slate-200">{stats?.users?.teachers || 0}</b></span>
            <button
              onClick={() => setActiveTab('teachers')}
              className="text-purple-400 hover:text-purple-300 font-semibold"
            >
              Review →
            </button>
          </div>
        </div>

        {/* Card 3: Platform Examinations */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Exam Repositories</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">
              {stats?.exams?.total || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              <span className="text-emerald-400 font-semibold">{stats?.exams?.published || 0}</span> active & published
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Drafts: <b className="text-slate-200">{stats?.exams?.drafts || 0}</b></span>
            <Link to="/exams" className="text-sky-400 hover:text-sky-300 font-semibold">
              Browse →
            </Link>
          </div>
        </div>

        {/* Card 4: Attempts & Submissions */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase font-semibold">Test Submissions</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">
              {stats?.attempts?.total || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Average Score: <span className="text-amber-400 font-semibold">{stats?.attempts?.avg_score || 0}%</span>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Completed: <b className="text-slate-200">{stats?.attempts?.completed || 0}</b></span>
            <span>Groups: <b className="text-slate-200">{stats?.groups?.total || 0}</b></span>
          </div>
        </div>
      </div>

      {/* Main Content Area with Navigation Tabs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('teachers')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'teachers'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Teacher Verifications</span>
              {pendingTeachersCount > 0 && (
                <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-2 py-0.2 rounded-full">
                  {pendingTeachersCount} pending
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'users'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>All Platform Users</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded-md">
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>System Insights</span>
            </button>
          </div>
        </div>

        {/* TAB 1: TEACHER VERIFICATION HUB */}
        {activeTab === 'teachers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-400" />
                  <span>Faculty & Staff Verification Board</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Review submitted College / Institute ID cards (PDF / Image) and grant examination authoring credentials.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-950/60">
                    <th className="py-3.5 px-4 font-semibold">Teacher Name</th>
                    <th className="py-3.5 px-4 font-semibold">College / Institute</th>
                    <th className="py-3.5 px-4 font-semibold">Institute ID Document</th>
                    <th className="py-3.5 px-4 font-semibold">Verification Status</th>
                    <th className="py-3.5 px-4 font-semibold">Activity</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {teachersList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No registered teachers found in the database.
                      </td>
                    </tr>
                  ) : (
                    teachersList.map((teacher) => {
                      const isPending = !teacher.is_verified_teacher && teacher.verification_status !== 'rejected';
                      const isRejected = teacher.verification_status === 'rejected';
                      const isBusy = actionLoadingId === teacher.id;
                      const hasDoc = Boolean(teacher.id_card_filename || teacher.id_card_data);
                      const isPdf = teacher.id_card_filename?.toLowerCase().endsWith('.pdf') || teacher.id_card_mimetype === 'application/pdf';

                      return (
                        <tr key={teacher.id} className="hover:bg-slate-800/30 transition-colors">
                          {/* Name & Email */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {teacher.name?.charAt(0).toUpperCase() || 'T'}
                              </div>
                              <div>
                                <span className="font-bold text-white block">{teacher.name}</span>
                                <span className="text-[11px] text-slate-400 font-mono">{teacher.email}</span>
                              </div>
                            </div>
                          </td>

                          {/* College / Institution */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-slate-200">
                              <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="font-medium">{teacher.institution_name || 'Stanford School of Engineering'}</span>
                            </div>
                          </td>

                          {/* ID Card Document (PDF/Image) */}
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => setPreviewingTeacher(teacher)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800/90 hover:bg-slate-700 text-indigo-300 border border-slate-700 hover:border-indigo-500/40 transition-colors shadow-sm"
                              title="Click to view full ID card PDF/Image"
                            >
                              {isPdf ? (
                                <FileText className="w-3.5 h-3.5 text-rose-400" />
                              ) : (
                                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                              <span className="max-w-[120px] truncate">
                                {teacher.id_card_filename || 'faculty_id.pdf'}
                              </span>
                              <Eye className="w-3 h-3 text-slate-400 ml-0.5" />
                            </button>
                          </td>

                          {/* Verification Status */}
                          <td className="py-3.5 px-4">
                            {teacher.is_verified_teacher ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Verified Faculty</span>
                              </span>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                <XCircle className="w-3 h-3 text-rose-400" />
                                <span>Rejected</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>Pending Review</span>
                              </span>
                            )}
                          </td>

                          {/* Activity */}
                          <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                            <div>{teacher.created_exams_count || 0} exams</div>
                            <div className="text-slate-500">{teacher.login_count || 1} logins</div>
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setPreviewingTeacher(teacher)}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                              >
                                View ID
                              </button>

                              {!teacher.is_verified_teacher ? (
                                <>
                                  <button
                                    onClick={() => handleToggleTeacherVerification(teacher, true)}
                                    disabled={isBusy}
                                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1 shadow-sm"
                                  >
                                    {isBusy ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                    <span>Verify</span>
                                  </button>
                                  <button
                                    onClick={() => setRejectModalTeacher(teacher)}
                                    disabled={isBusy}
                                    className="px-2 py-1 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                                  >
                                    Reject
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleToggleTeacherVerification(teacher, false)}
                                  disabled={isBusy}
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                                >
                                  Revoke
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ALL PLATFORM USERS */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 shrink-0 font-medium">Role:</span>
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="teacher">Teachers</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 shrink-0 font-medium">Status:</span>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Accounts</option>
                  <option value="suspended">Suspended Accounts</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-950/60">
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Login Count</th>
                    <th className="py-3 px-4 font-semibold">Joined Date</th>
                    <th className="py-3 px-4 font-semibold text-right">Account Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-500 mb-2" />
                        Filtering users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No users match the search criteria.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const isBusy = actionLoadingId === u.id;

                      return (
                        <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                                u.role === 'admin'
                                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                                  : u.role === 'teacher'
                                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-600'
                                  : 'bg-gradient-to-tr from-indigo-600 to-sky-600'
                              }`}>
                                {u.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div>
                                <span className="font-bold text-white block">{u.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u, e.target.value)}
                              disabled={isBusy || u.id === user?.id}
                              className={`text-[10px] font-bold uppercase rounded px-2 py-1 bg-slate-950 border transition-colors cursor-pointer ${
                                u.role === 'admin'
                                  ? 'text-purple-300 border-purple-500/30'
                                  : u.role === 'teacher'
                                  ? 'text-emerald-300 border-emerald-500/30'
                                  : 'text-indigo-300 border-indigo-500/30'
                              }`}
                            >
                              <option value="student">Student</option>
                              <option value="teacher">Teacher</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              u.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <span className="bg-slate-800/80 px-2 py-0.5 rounded text-xs font-bold text-indigo-300">
                              {u.login_count || 1} logins
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px]">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <Link
                              to={`/users/${u.id}`}
                              className="p-1.5 inline-flex items-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              title="View Public Profile"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>

                            {u.id !== user?.id && (
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                disabled={isBusy}
                                className={`p-1.5 inline-flex items-center rounded-lg transition-colors ${
                                  u.status === 'active'
                                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                }`}
                                title={u.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                              >
                                {u.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PLATFORM ANALYTICS & OVERVIEW */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Distribution Box */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>Account Composition</span>
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Students</span>
                      <span className="font-bold text-white">{stats?.users?.students || 0}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-full rounded-full"
                        style={{ width: `${stats?.users?.total ? ((stats.users.students / stats.users.total) * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Faculty & Teachers</span>
                      <span className="font-bold text-white">{stats?.users?.teachers || 0}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${stats?.users?.total ? ((stats.users.teachers / stats.users.total) * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">System Administrators</span>
                      <span className="font-bold text-white">{stats?.users?.admins || 0}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-purple-500 h-full rounded-full"
                        style={{ width: `${stats?.users?.total ? ((stats.users.admins / stats.users.total) * 100) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment Activity Box */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Assessment & Engagement Metrics</span>
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 block text-[11px]">Total Session Logins</span>
                    <span className="text-xl font-bold text-indigo-400 font-mono mt-1 block">
                      {stats?.users?.total_logins || 0}
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 block text-[11px]">Exam Pass Average</span>
                    <span className="text-xl font-bold text-amber-400 font-mono mt-1 block">
                      {stats?.attempts?.avg_score || 0}%
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 block text-[11px]">Group Discussions</span>
                    <span className="text-xl font-bold text-sky-400 font-mono mt-1 block">
                      {stats?.groups?.messages || 0} msgs
                    </span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-slate-400 block text-[11px]">Verified Faculty %</span>
                    <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">
                      {stats?.users?.teachers ? Math.round((stats.users.verified_teachers / stats.users.teachers) * 100) : 100}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: TEACHER INSTITUTE ID CARD PREVIEW MODAL (PDF / IMAGE) */}
      {previewingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>{previewingTeacher.name}</span>
                    <span className="text-xs font-normal text-slate-400">({previewingTeacher.email})</span>
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-200 font-semibold">{previewingTeacher.institution_name || 'Stanford School of Engineering'}</span>
                    <span className="text-slate-600">•</span>
                    <span>Document: <b className="text-slate-300">{previewingTeacher.id_card_filename || 'faculty_id.pdf'}</b></span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={adminService.getTeacherIdCardUrl(previewingTeacher.id)}
                  download={previewingTeacher.id_card_filename || `faculty_id_${previewingTeacher.id}.pdf`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  title="Download copy"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setPreviewingTeacher(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Document Viewer */}
            <div className="flex-1 p-4 bg-slate-950 overflow-auto flex items-center justify-center min-h-[400px]">
              {(previewingTeacher.id_card_filename?.toLowerCase().endsWith('.pdf') || 
                previewingTeacher.id_card_mimetype === 'application/pdf' || 
                (!previewingTeacher.id_card_data?.startsWith('data:image/'))) ? (
                <div className="w-full h-[60vh] flex flex-col rounded-2xl overflow-hidden border border-slate-800 bg-slate-900">
                  <iframe
                    src={adminService.getTeacherIdCardUrl(previewingTeacher.id)}
                    title="Faculty ID Document Preview"
                    className="w-full h-full border-0"
                  />
                </div>
              ) : (
                <div className="max-h-[60vh] flex items-center justify-center p-2 bg-slate-900 rounded-2xl border border-slate-800">
                  <img
                    src={previewingTeacher.id_card_data || adminService.getTeacherIdCardUrl(previewingTeacher.id)}
                    alt="Teacher ID Card Document"
                    className="max-h-[56vh] object-contain rounded-xl shadow-lg"
                  />
                </div>
              )}
            </div>

            {/* Modal Action Controls Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Verification status:</span>
                {previewingTeacher.is_verified_teacher ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Verified Faculty
                  </span>
                ) : previewingTeacher.verification_status === 'rejected' ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Verification Rejected
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Pending Admin Review
                  </span>
                )}
                {previewingTeacher.verification_notes && (
                  <span className="text-slate-500 italic">"{previewingTeacher.verification_notes}"</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!previewingTeacher.is_verified_teacher ? (
                  <>
                    <button
                      onClick={() => handleToggleTeacherVerification(previewingTeacher, true)}
                      disabled={actionLoadingId === previewingTeacher.id}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/25"
                    >
                      {actionLoadingId === previewingTeacher.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Approve & Verify Credentials</span>
                    </button>
                    <button
                      onClick={() => {
                        setRejectModalTeacher(previewingTeacher);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                    >
                      Reject Verification
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleToggleTeacherVerification(previewingTeacher, false)}
                    disabled={actionLoadingId === previewingTeacher.id}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
                  >
                    Revoke Verification
                  </button>
                )}
                <button
                  onClick={() => setPreviewingTeacher(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT VERIFICATION FEEDBACK MODAL */}
      {rejectModalTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Reject Faculty Verification</h3>
                <p className="text-xs text-slate-400">For {rejectModalTeacher.name} ({rejectModalTeacher.email})</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Reason / Feedback Note (Optional)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. ID card image is blurred, or college enrollment cannot be verified."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalTeacher(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleTeacherVerification(rejectModalTeacher, false, rejectReason)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
