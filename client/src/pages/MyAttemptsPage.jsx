import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Award, CheckCircle2, XCircle, Clock, 
  ArrowRight, RefreshCw, BookOpen, Compass
} from 'lucide-react';
import examService from '../services/examService';
import { useToast } from '../context/ToastContext';

export default function MyAttemptsPage() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    const fetchMyAttempts = async () => {
      try {
        setLoading(true);
        const res = await examService.getMyAttempts();
        setAttempts(res.data || []);
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to load test history');
      } finally {
        setLoading(false);
      }
    };

    fetchMyAttempts();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading your examination results...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            Student Performance
          </span>
          <h1 className="text-2xl font-bold text-white mt-2">
            My Examination Records
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track your completed tests, grade percentages, and detailed answer sheet reviews.
          </p>
        </div>
        <Link
          to="/exams"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/20"
        >
          <Compass className="w-4 h-4" />
          <span>Browse Available Exams</span>
        </Link>
      </div>

      {/* Attempts List */}
      {attempts.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-16 text-center space-y-4">
          <Award className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No Test Attempts Yet</h3>
            <p className="text-xs text-slate-400">You haven't completed any online examinations yet.</p>
          </div>
          <Link
            to="/exams"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
          >
            <span>Take Your First Exam</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attempts.map((att) => {
            const isPass = Number(att.percentage) >= Number(att.pass_percentage || 50);
            return (
              <div
                key={att.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 flex flex-col justify-between space-y-4 transition-all shadow-lg"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      {att.exam_code}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      isPass
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {isPass ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{isPass ? 'Passed' : 'Failed'}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white line-clamp-1">{att.exam_title}</h3>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <div>
                      Score: <span className="font-bold text-white">{att.score || 0} / {att.total_points || 0}</span>
                    </div>
                    <div>
                      Grade: <span className="font-bold text-indigo-400">{att.percentage || 0}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <span className="text-[11px] text-slate-500">
                    {att.submitted_at ? new Date(att.submitted_at).toLocaleDateString() : 'In Progress'}
                  </span>
                  <Link
                    to={`/exams/results/${att.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    <span>View Result Sheet</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
