import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Clock, Award, Search, ArrowRight, 
  CheckCircle2, Sparkles, RefreshCw, CheckSquare
} from 'lucide-react';
import examService from '../services/examService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export default function ExamsListPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { isAuthenticated, user } = useAuth();
  const { showError } = useToast();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        const res = await examService.getExams({ public_only: true });
        setExams(res.data || []);
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to load examinations catalog');
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  const filteredExams = exams
    .filter(exam => !exam.group_id) // Group exams are exclusively accessed inside their respective groups/classes
    .filter(exam => {
      return exam.title.toLowerCase().includes(search.toLowerCase()) ||
             exam.description?.toLowerCase().includes(search.toLowerCase()) ||
             exam.code?.toLowerCase().includes(search.toLowerCase());
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-slate-800 p-8 sm:p-10 overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Online Examinations</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Available Examinations
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Participate in timed examinations with automated scoring and instant grade feedback.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
        <div className="text-sm font-semibold text-slate-300">
          Total Exams: <span className="text-indigo-400 font-mono">{filteredExams.length}</span>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search exam title or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Exams Grid */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading available examinations...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-16 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Examinations Available</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {search 
              ? 'No exams matched your search query.' 
              : 'Make sure your created exams are published from the Teacher Dashboard.'}
          </p>
          {user && (user.role === 'teacher' || user.role === 'admin') && (
            <div className="pt-2">
              <Link
                to="/teacher/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
              >
                <span>Go to Teacher Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              className="group bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1"
            >
              <div className="space-y-4">
                {/* Code Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                    {exam.code}
                  </span>
                  <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    Total Marks: {Number(exam.total_marks || 100).toFixed(0)}
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {exam.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {exam.description || 'Comprehensive test assessment.'}
                  </p>
                </div>

                {/* Exam Details Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/50">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-xs">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      <span className="font-semibold text-white">{exam.duration_minutes}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Mins</span>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/50">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-xs">
                      <CheckSquare className="w-3 h-3 text-indigo-400" />
                      <span className="font-semibold text-white">{exam.question_count || 0}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Questions</span>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/50">
                    <div className="flex items-center justify-center gap-1 text-slate-400 text-xs">
                      <Award className="w-3 h-3 text-indigo-400" />
                      <span className="font-semibold text-white">{exam.pass_percentage}%</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Pass Mark</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6">
                {isAuthenticated ? (
                  <Link
                    to={`/exams/${exam.id}/take`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all"
                  >
                    <span>Take Exam</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    <span>Sign in to Take Exam</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
