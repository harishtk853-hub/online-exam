import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Award, CheckCircle2, XCircle, Clock, ArrowLeft, 
  HelpCircle, RefreshCw, Check, X, BookOpen, Compass
} from 'lucide-react';
import examService from '../services/examService';
import { useToast } from '../context/ToastContext';

export default function ExamResultPage() {
  const { attemptId } = useParams();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const res = await examService.getAttemptDetails(attemptId);
        setAttempt(res.data);
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to load examination result');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">Evaluating and calculating results...</p>
      </div>
    );
  }

  if (!attempt) return null;

  const isPassed = Number(attempt.percentage) >= Number(attempt.pass_percentage || 50);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/exams"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Exams Catalog</span>
        </Link>
        <Link
          to="/my-attempts"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <Award className="w-4 h-4" />
          <span>View All My Results</span>
        </Link>
      </div>

      {/* Result Scorecard Banner */}
      <div className={`rounded-3xl border p-8 sm:p-10 shadow-2xl relative overflow-hidden ${
        isPassed
          ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/30'
          : 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/30'
      }`}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-slate-950/60 border border-slate-800 text-slate-300">
              <span>{attempt.exam_code}</span>
              <span>•</span>
              <span>Examination Result</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {attempt.exam_title}
            </h1>
            <p className="text-xs text-slate-400">
              Candidate: <span className="font-semibold text-slate-200">{attempt.student_name}</span> ({attempt.student_email})
            </p>
          </div>

          {/* Pass / Fail Big Badge */}
          <div className={`p-6 rounded-2xl border flex flex-col items-center justify-center min-w-[180px] ${
            isPassed
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            {isPassed ? (
              <CheckCircle2 className="w-10 h-10 mb-2" />
            ) : (
              <XCircle className="w-10 h-10 mb-2" />
            )}
            <span className="text-2xl font-black">{isPassed ? 'PASSED' : 'FAILED'}</span>
            <span className="text-xs text-slate-400 mt-1">Pass Mark: {attempt.pass_percentage}%</span>
          </div>
        </div>

        {/* Score Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-800/80 text-center">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="text-2xl sm:text-3xl font-black text-white">
              {attempt.score || 0}
              <span className="text-sm font-normal text-slate-500"> / {attempt.total_points || 0}</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
              Final Score
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className={`text-2xl sm:text-3xl font-black ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {attempt.percentage}%
            </div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
              Percentage
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="text-2xl sm:text-3xl font-black text-indigo-400">
              {attempt.answers?.filter(a => a.is_correct).length || 0}
              <span className="text-sm font-normal text-slate-500"> / {attempt.answers?.length || 0}</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
              Correct Answers
            </div>
          </div>
        </div>
      </div>

      {/* Question by Question Answer Review */}
      {attempt.allow_review && attempt.answers && attempt.answers.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-white">Detailed Answer Sheet Review</h2>
          </div>

          {attempt.answers.map((ans, idx) => {
            const isCorrect = ans.is_correct;
            return (
              <div
                key={ans.id}
                className={`bg-slate-900/80 border rounded-2xl p-6 space-y-4 shadow-lg ${
                  isCorrect
                    ? 'border-emerald-500/30'
                    : 'border-rose-500/30'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${
                      isCorrect
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      Q{idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-white">Question #{idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      isCorrect
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {ans.points_awarded} / {ans.max_points} pts
                    </span>
                  </div>
                </div>

                {/* Statement */}
                <div className="text-sm sm:text-base font-medium text-white">
                  {ans.question_text}
                </div>

                {/* Options display */}
                {ans.options && ans.options.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {ans.options.map((opt, optIdx) => {
                      const isStudentSelected = ans.selected_option_id === opt.id;
                      const isOptCorrect = opt.is_correct;

                      let optStyle = 'bg-slate-950/60 border-slate-800 text-slate-400';
                      if (isOptCorrect) {
                        optStyle = 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300';
                      } else if (isStudentSelected && !isOptCorrect) {
                        optStyle = 'bg-rose-950/30 border-rose-500/50 text-rose-300';
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${optStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 rounded-md bg-slate-900 flex items-center justify-center font-mono">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt.option_text}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isStudentSelected && (
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                                Your Answer
                              </span>
                            )}
                            {isOptCorrect && (
                              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                <span>Correct Answer</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Short answer review */}
                {ans.question_type === 'short_answer' && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div>
                      <span className="text-slate-400">Your Answer: </span>
                      <span className="font-semibold text-white">{ans.text_answer || '(No answer provided)'}</span>
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {ans.explanation && (
                  <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-indigo-300">Explanation: </span>
                      <span>{ans.explanation}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
