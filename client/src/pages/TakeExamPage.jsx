import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, AlertTriangle, ChevronLeft, ChevronRight, Bookmark, 
  CheckCircle2, Send, RefreshCw, HelpCircle, ShieldAlert
} from 'lucide-react';
import examService from '../services/examService';
import { useToast } from '../context/ToastContext';

export default function TakeExamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exam, setExam] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Student Answers Store: { [questionId]: { selected_option_id, text_answer } }
  const [answers, setAnswers] = useState({});
  // Flagged for review set
  const [flagged, setFlagged] = useState({});
  // Time Remaining in Seconds
  const [timeLeft, setTimeLeft] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const timerRef = useRef(null);

  // Start attempt on load
  useEffect(() => {
    const initExam = async () => {
      try {
        setLoading(true);
        const res = await examService.startAttempt(id);
        const { attemptId: newAttemptId, exam: examDetails } = res.data;
        
        setAttemptId(newAttemptId);
        setExam(examDetails);
        setQuestions(examDetails.questions || []);
        setTimeLeft((examDetails.duration_minutes || 60) * 60);
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to start exam session');
        navigate('/exams');
      } finally {
        setLoading(false);
      }
    };

    initExam();
  }, [id, navigate]);

  // Countdown Timer
  useEffect(() => {
    if (loading || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading]);

  const handleSelectOption = (questionId, optionId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        selected_option_id: optionId
      }
    }));
  };

  const handleTextAnswer = (questionId, text) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        text_answer: text
      }
    }));
  };

  const toggleFlag = (questionId) => {
    setFlagged(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const handleAutoSubmit = async () => {
    showError('Time expired! Your exam is being automatically submitted.');
    await executeSubmission();
  };

  const executeSubmission = async () => {
    try {
      setSubmitting(true);
      if (timerRef.current) clearInterval(timerRef.current);

      const answersPayload = Object.values(answers);
      const res = await examService.submitAttempt(id, attemptId, answersPayload);
      
      showSuccess('Exam submitted successfully!');
      navigate(`/exams/results/${attemptId}`);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit exam');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">Preparing secure examination room...</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const currentAnswer = answers[currentQ.id];
  const isCurrentFlagged = Boolean(flagged[currentQ.id]);

  // Format Time Remaining
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isTimeCritical = timeLeft < 300; // less than 5 minutes

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Floating Status Bar */}
      <div className="sticky top-20 z-40 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {exam?.code}
          </span>
          <h1 className="text-base font-bold text-white hidden sm:block truncate max-w-sm">
            {exam?.title}
          </h1>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
            {Number(exam?.total_marks || 100).toFixed(0)} Marks
          </span>
        </div>

        {/* Real-Time Countdown Timer */}
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border font-mono font-bold text-sm sm:text-base ${
          isTimeCritical
            ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 animate-pulse'
            : 'bg-slate-950 border-slate-800 text-white'
        }`}>
          <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-400' : 'text-indigo-400'}`} />
          <span>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
        </div>

        {/* Submit Trigger */}
        <button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 active:scale-[0.98] transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Submit Exam</span>
        </button>
      </div>

      {/* Main Examination Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left/Center: Active Question Stage */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            {/* Question Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm font-bold flex items-center justify-center">
                  Q{currentIndex + 1}
                </span>
                <div>
                  <span className="text-xs text-slate-400">Question {currentIndex + 1} of {questions.length}</span>
                  <span className="text-xs text-indigo-400 font-semibold ml-2">({currentQ.points} marks)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleFlag(currentQ.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isCurrentFlagged
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isCurrentFlagged ? 'Flagged' : 'Flag for Review'}</span>
              </button>
            </div>

            {/* Question Statement */}
            <div className="text-base sm:text-lg font-medium text-white leading-relaxed">
              {currentQ.question_text}
            </div>

            {/* Options List */}
            {['mcq', 'true_false'].includes(currentQ.question_type) && (
              <div className="space-y-3 pt-2">
                {currentQ.options?.map((opt, optIdx) => {
                  const isSelected = currentAnswer?.selected_option_id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, opt.id)}
                      className={`w-full text-left p-4 rounded-xl border flex items-center gap-4 transition-all ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                          : 'bg-slate-900 border border-slate-800 text-slate-400'
                      }`}>
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <span className="text-sm font-medium flex-grow">{opt.option_text}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Short Answer Input */}
            {currentQ.question_type === 'short_answer' && (
              <div className="pt-2 space-y-2">
                <label className="block text-xs font-medium text-slate-400">
                  Type your answer below:
                </label>
                <input
                  type="text"
                  placeholder="Enter answer..."
                  value={currentAnswer?.text_answer || ''}
                  onChange={(e) => handleTextAnswer(currentQ.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Navigation Bottom Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-950 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-950 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Question</span>
              </button>

              <button
                type="button"
                disabled={currentIndex === questions.length - 1}
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all shadow-md shadow-indigo-600/20"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Question Navigation Palette */}
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white">Questions Navigation</h3>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = Boolean(answers[q.id]);
                const isFlagged = Boolean(flagged[q.id]);
                const isCurrent = idx === currentIndex;

                let btnStyle = 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700';
                if (isCurrent) {
                  btnStyle = 'bg-indigo-600 text-white ring-2 ring-indigo-400 border-transparent';
                } else if (isAnswered) {
                  btnStyle = 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300';
                } else if (isFlagged) {
                  btnStyle = 'bg-amber-950/40 border-amber-500/50 text-amber-300';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl border font-mono text-xs font-bold transition-all relative ${btnStyle}`}
                  >
                    {idx + 1}
                    {isFlagged && !isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-900 border border-emerald-500" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-900 border border-amber-500" />
                <span>Flagged for review ({Object.values(flagged).filter(Boolean).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-950 border border-slate-800" />
                <span>Unanswered ({questions.length - answeredCount})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Before Submission */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-white">Ready to Submit?</h3>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <span className="font-bold text-white">{questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Questions Answered:</span>
                <span className="font-bold text-emerald-400">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Unanswered Questions:</span>
                <span className="font-bold text-rose-400">{questions.length - answeredCount}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Once you submit, your responses will be evaluated and graded immediately. You cannot modify your answers afterwards.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Continue Exam
              </button>
              <button
                type="button"
                onClick={executeSubmission}
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/30"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Submitting...' : 'Confirm & Submit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
