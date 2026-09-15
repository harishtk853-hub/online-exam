import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, BookOpen, Users, CheckCircle2, Clock, 
  BarChart3, Edit3, Eye, Trash2, Globe, Lock, AlertCircle, RefreshCw,
  ShieldCheck, ShieldAlert
} from 'lucide-react';
import examService from '../services/examService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export default function TeacherDashboardPage() {
  const [stats, setStats] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const { user } = useAuth();
  const isVerified = user?.role === 'admin' || Boolean(user?.is_verified_teacher);
  const { showSuccess, showError } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, examsRes] = await Promise.all([
        examService.getTeacherStats(),
        examService.getExams({ mine: true })
      ]);
      setStats(statsRes.data.stats);
      setExams(examsRes.data || []);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to load teacher dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePublish = async (examId) => {
    try {
      setActionLoadingId(examId);
      const res = await examService.togglePublish(examId);
      showSuccess(res.message);
      loadData();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update publish state');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteExam = async (examId, title) => {
    if (!window.confirm(`Are you sure you want to delete the exam "${title}"? This cannot be undone.`)) {
      return;
    }
    try {
      setActionLoadingId(examId);
      await examService.deleteExam(examId);
      showSuccess('Exam deleted successfully');
      setExams(exams.filter(e => e.id !== examId));
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete exam');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading staff dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              Faculty & Staff Suite
            </span>
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded-full shadow-sm shadow-emerald-500/10">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified Faculty (Full Access)</span>
              </span>
            ) : user?.verification_status === 'rejected' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-300 bg-rose-500/15 border border-rose-500/30 rounded-full">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Verification Rejected</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-full">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Unverified Teacher (Verification Required)</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2">
            Assessment & Exam Hub
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Author interactive tests, configure marking schemes, and track student submissions in real time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isVerified ? (
            <Link
              to="/teacher/exams/create"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] shadow-lg shadow-indigo-600/25 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Exam</span>
            </Link>
          ) : (
            <Link
              to="/profile"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 active:scale-[0.98] transition-all"
              title="Verification required before creating exams"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Verify ID to Create Exams</span>
            </Link>
          )}
        </div>
      </div>

      {/* Faculty Verification & Capabilities Card */}
      {isVerified ? (
        <div className="p-4 sm:p-5 rounded-2xl border bg-emerald-950/20 border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-semibold text-white text-sm flex flex-wrap items-center gap-2">
                <span>Verified Faculty Status: Active</span>
                {user?.institution_name && (
                  <span className="text-[11px] font-normal text-emerald-300 px-2.5 py-0.5 rounded-full bg-emerald-900/40 border border-emerald-700/40">
                    🏛️ {user.institution_name}
                  </span>
                )}
              </div>
              <p className="text-slate-300 leading-relaxed">
                Your faculty credentials are verified. You have full permission to create and publish both <strong className="text-white">Public Exams</strong> (sitewide) and <strong className="text-white">Group-Specific Exams</strong>.
              </p>
            </div>
          </div>
          <Link
            to="/profile"
            className="shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-200 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors self-start sm:self-auto"
          >
            View Faculty ID
          </Link>
        </div>
      ) : (
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          user?.verification_status === 'rejected'
            ? 'bg-rose-950/25 border-rose-500/25 text-rose-300'
            : 'bg-amber-950/25 border-amber-500/25 text-amber-300'
        }`}>
          <div className="flex items-start gap-3.5">
            <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${
              user?.verification_status === 'rejected'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-semibold text-white text-sm flex flex-wrap items-center gap-2">
                <span>
                  {user?.verification_status === 'rejected'
                    ? 'Faculty Verification Rejected'
                    : 'Unverified Faculty Account (Limited Mode)'}
                </span>
                {user?.institution_name && (
                  <span className="text-[11px] font-normal text-slate-300 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700">
                    {user.institution_name}
                  </span>
                )}
              </div>
              <p className="text-slate-300 leading-relaxed">
                {user?.verification_status === 'rejected' ? (
                  <>Your verification was rejected{user?.verification_notes ? `: "${user.verification_notes}"` : ''}. Please re-upload a clear copy of your College / Institute ID Card to enable exam creation.</>
                ) : (
                  <>
                    <strong className="text-amber-300">Exam Authoring:</strong> Locked until your College / Institute ID card is verified and approved by an administrator.
                  </>
                )}
              </p>
            </div>
          </div>
          <Link
            to="/profile"
            className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-colors border self-start sm:self-auto ${
              user?.verification_status === 'rejected'
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-500/30'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-500/30'
            }`}
          >
            {user?.verification_status === 'rejected' ? 'Re-upload ID Card' : 'Submit / Check ID Verification'}
          </Link>
        </div>
      )}

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Created</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">{stats?.total_exams || 0}</span>
            <span className="text-xs text-slate-400 ml-2">tests authoring</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active Published</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-400">{stats?.active_exams || 0}</span>
            <span className="text-xs text-slate-400 ml-2">live for students</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Submissions</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">{stats?.total_submissions || 0}</span>
            <span className="text-xs text-slate-400 ml-2">student attempts</span>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pass Rate</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-400">{stats?.pass_rate || 0}%</span>
            <span className="text-xs text-slate-400 ml-2">avg {stats?.avg_score || 0}%</span>
          </div>
        </div>
      </div>

      {/* Exams Management Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Your Examination Catalog</h2>
            <p className="text-xs text-slate-400">Manage settings, questions, publish state, and view student marks.</p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-1 rounded-lg">
            {exams.length} Exams
          </span>
        </div>

        {exams.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-white">No exams created yet</p>
              <p className="text-xs text-slate-400">Get started by creating your first exam with custom MCQ questions.</p>
            </div>
            <Link
              to="/teacher/exams/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Exam</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Exam Info</th>
                  <th className="px-6 py-4">Total Marks</th>
                  <th className="px-6 py-4">Duration & Pass %</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Submissions</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{exam.title}</span>
                        {exam.group_id ? (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            Group Exam
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            Public Exam
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                        <span>Code: {exam.code}</span>
                        <span>•</span>
                        <span>{exam.question_count || 0} Questions</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                        {Number(exam.total_marks || 100).toFixed(0)} Marks
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{exam.duration_minutes} mins</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Pass Mark: {exam.pass_percentage}%
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublish(exam.id)}
                        disabled={actionLoadingId === exam.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                          exam.is_published
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                        }`}
                        title="Click to toggle publish status"
                      >
                        {exam.is_published ? (
                          <>
                            <Globe className="w-3 h-3 text-emerald-400" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/teacher/exams/${exam.id}/submissions`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{exam.attempt_count || 0} Attempts</span>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/teacher/exams/${exam.id}/edit`}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Edit Exam & Questions"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/teacher/exams/${exam.id}/submissions`}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-400 transition-colors"
                          title="View Student Results"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteExam(exam.id, exam.title)}
                          disabled={actionLoadingId === exam.id}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete Exam"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
