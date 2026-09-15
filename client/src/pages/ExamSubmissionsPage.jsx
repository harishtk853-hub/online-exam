import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Users, Award, CheckCircle2, XCircle, 
  Clock, Search, Download, RefreshCw, Eye
} from 'lucide-react';
import examService from '../services/examService';
import { useToast } from '../context/ToastContext';

export default function ExamSubmissionsPage() {
  const { id } = useParams();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const res = await examService.getExamSubmissions(id);
        setExam(res.data.exam);
        setSubmissions(res.data.submissions || []);
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to load submissions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [id]);

  const filteredSubmissions = submissions.filter(s => 
    s.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.student_email?.toLowerCase().includes(search.toLowerCase())
  );

  const passedCount = submissions.filter(s => Number(s.percentage) >= Number(exam?.pass_percentage || 50)).length;
  const avgPercentage = submissions.length > 0
    ? (submissions.reduce((acc, s) => acc + Number(s.percentage || 0), 0) / submissions.length).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading student submissions...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/teacher/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Teacher Dashboard</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to={`/teacher/exams/${id}/edit`}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Edit Exam
          </Link>
        </div>
      </div>

      {/* Exam Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {exam?.code}
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Total Marks: {Number(exam?.total_marks || 100).toFixed(0)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1.5">{exam?.title}</h1>
            <p className="text-xs text-slate-400 mt-1">
              Pass Criteria: {exam?.pass_percentage}% • Duration: {exam?.duration_minutes} mins
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
            <div className="text-center px-3 border-r border-slate-800">
              <div className="text-xl font-bold text-white">{submissions.length}</div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Total Attempts</div>
            </div>
            <div className="text-center px-3 border-r border-slate-800">
              <div className="text-xl font-bold text-emerald-400">{passedCount}</div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Passed</div>
            </div>
            <div className="text-center px-3">
              <div className="text-xl font-bold text-indigo-400">{avgPercentage}%</div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">Average Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions List Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>Student Submissions ({filteredSubmissions.length})</span>
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-300">No submissions found</p>
            <p className="text-xs text-slate-500">Students who complete this exam will appear here automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Submitted At</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Percentage</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSubmissions.map((sub) => {
                  const isPass = Number(sub.percentage) >= Number(exam?.pass_percentage || 50);
                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                            {sub.student_name?.charAt(0).toUpperCase() || 'S'}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{sub.student_name}</div>
                            <div className="text-xs text-slate-400">{sub.student_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'In Progress'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-white">{sub.score || 0}</span>
                        <span className="text-xs text-slate-400"> / {sub.total_points || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-indigo-400">{sub.percentage || 0}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isPass
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {isPass ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{isPass ? 'Passed' : 'Failed'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/exams/results/${sub.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Sheet</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
