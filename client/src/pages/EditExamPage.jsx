import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, PlusCircle, Trash2, CheckCircle, Clock, 
  Settings, BookOpen, Check, Sparkles, RefreshCw, Save,
  Users, AlertCircle
} from 'lucide-react';
import examService from '../services/examService';
import groupService from '../services/groupService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export default function EditExamPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isVerifiedFaculty = user?.role === 'admin' || Boolean(user?.is_verified_teacher);
  const { showSuccess, showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState([]);

  const [examData, setExamData] = useState({
    title: '',
    description: '',
    instructions: '',
    category: 'General',
    group_id: '',
    duration_minutes: 60,
    pass_percentage: 50,
    is_published: false,
    shuffle_questions: false,
    allow_review: true
  });

  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const fetchExamAndGroups = async () => {
      try {
        setLoading(true);
        const [res, groupsRes] = await Promise.all([
          examService.getExamById(id),
          groupService.getGroups().catch(() => ({ data: [] }))
        ]);
        const exam = res.data;
        setGroups(groupsRes.data || []);
        setExamData({
          title: exam.title || '',
          description: exam.description || '',
          instructions: exam.instructions || '',
          category: exam.category || 'General',
          group_id: exam.group_id || '',
          duration_minutes: exam.duration_minutes || 60,
          total_marks: exam.total_marks || 100,
          pass_percentage: exam.pass_percentage || 50,
          is_published: Boolean(exam.is_published),
          shuffle_questions: Boolean(exam.shuffle_questions),
          allow_review: Boolean(exam.allow_review)
        });
        setQuestions(exam.questions || []);
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to load exam details');
        navigate('/teacher/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchExamAndGroups();
  }, [id, navigate]);

  const handleExamChange = (field, value) => {
    setExamData(prev => ({ ...prev, [field]: value }));
  };

  const handleDistributeMarks = () => {
    if (!questions.length) return;
    const targetTotal = Number(examData.total_marks !== undefined && examData.total_marks !== '' ? examData.total_marks : totalPoints) || 100;
    const perQuestion = Number((targetTotal / questions.length).toFixed(2));
    setQuestions(prev => prev.map(q => ({ ...q, points: perQuestion })));
    setExamData(prev => ({ ...prev, total_marks: targetTotal }));
    showSuccess(`Distributed ${targetTotal} marks evenly (${perQuestion} pts/question across ${questions.length} questions)`);
  };

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        id: 'new-' + Date.now(),
        isNew: true,
        question_text: '',
        question_type: 'mcq',
        points: 2.0,
        explanation: '',
        options: [
          { option_text: '', is_correct: true },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false }
        ]
      }
    ]);
  };

  const handleRemoveQuestion = async (index, qId, isNew) => {
    if (questions.length === 1) {
      showError('Exam must contain at least one question');
      return;
    }

    if (!isNew) {
      try {
        await examService.deleteQuestion(id, qId);
      } catch (err) {
        showError('Failed to delete question from server');
        return;
      }
    }
    setQuestions(prev => prev.filter((_, i) => i !== index));
    showSuccess('Question removed');
  };

  const handleQuestionChange = (qIndex, field, value) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], [field]: value };
      if (field === 'question_type' && value === 'true_false') {
        updated[qIndex].options = [
          { option_text: 'True', is_correct: true },
          { option_text: 'False', is_correct: false }
        ];
      }
      return updated;
    });
  };

  const handleOptionChange = (qIndex, optIndex, text) => {
    setQuestions(prev => {
      const updated = [...prev];
      const opts = [...updated[qIndex].options];
      opts[optIndex] = { ...opts[optIndex], option_text: text };
      updated[qIndex].options = opts;
      return updated;
    });
  };

  const handleSetCorrectOption = (qIndex, optIndex) => {
    setQuestions(prev => {
      const updated = [...prev];
      const opts = updated[qIndex].options.map((opt, i) => ({
        ...opt,
        is_correct: i === optIndex
      }));
      updated[qIndex].options = opts;
      return updated;
    });
  };

  const handleAddOption = (qIndex) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[qIndex].options.push({ option_text: '', is_correct: false });
      return updated;
    });
  };

  const handleRemoveOption = (qIndex, optIndex) => {
    setQuestions(prev => {
      const updated = [...prev];
      if (updated[qIndex].options.length <= 2) {
        showError('MCQ requires at least 2 choices');
        return prev;
      }
      updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== optIndex);
      if (!updated[qIndex].options.some(o => o.is_correct) && updated[qIndex].options.length > 0) {
        updated[qIndex].options[0].is_correct = true;
      }
      return updated;
    });
  };

  const handleSaveAll = async () => {
    if (!examData.title.trim()) {
      showError('Exam title is required');
      return;
    }

    if (!isVerifiedFaculty && !examData.group_id) {
      showError('Unverified faculty cannot make exams Public. Please assign to a student group.');
      return;
    }

    try {
      setSaving(true);
      // 1. Update basic exam info
      await examService.updateExam(id, {
        ...examData,
        group_id: examData.group_id ? Number(examData.group_id) : null
      });

      // 2. Save/Update each question
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (q.isNew) {
          await examService.addQuestion(id, {
            question_text: q.question_text,
            question_type: q.question_type,
            points: Number(q.points),
            explanation: q.explanation || null,
            order_index: i,
            options: q.options
          });
        } else {
          await examService.updateQuestion(id, q.id, {
            question_text: q.question_text,
            question_type: q.question_type,
            points: Number(q.points),
            explanation: q.explanation || null,
            order_index: i,
            options: q.options
          });
        }
      }

      showSuccess('Exam updated successfully!');
      navigate('/teacher/dashboard');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading exam for editing...</p>
      </div>
    );
  }

  const totalPoints = questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/teacher/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
        </button>
      </div>

      {/* Settings Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Edit Exam Information</h2>
            <p className="text-xs text-slate-400">Update general properties, time limit, and category.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Exam Title
            </label>
            <input
              type="text"
              required
              value={examData.title}
              onChange={(e) => handleExamChange('title', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  Assign to Group {isVerifiedFaculty ? '(Optional)' : <span className="text-amber-400 font-semibold">* Required</span>}
                </span>
              </span>
            </label>
            <select
              value={examData.group_id}
              onChange={(e) => handleExamChange('group_id', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            >
              {isVerifiedFaculty ? (
                <option value="">-- No specific group (Public / Global Exam) --</option>
              ) : (
                <option value="" disabled>-- Select a Target Student Group (Required for Unverified Faculty) --</option>
              )}
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.code || `GRP-${g.id}`})
                </option>
              ))}
            </select>
            {!isVerifiedFaculty && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Faculty Notice:</strong> Public Exams are restricted to verified faculty. Unverified staff exams must be assigned to a specific student group.
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 md:col-span-2">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Total Exam Marks
              </label>
              <div className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-indigo-400 font-bold font-mono text-base flex items-center justify-between">
                <span>{totalPoints}</span>
                <span className="text-xs font-normal text-slate-400">Marks</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Duration (Mins)
              </label>
              <input
                type="number"
                min="1"
                max="300"
                value={examData.duration_minutes}
                onChange={(e) => handleExamChange('duration_minutes', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Pass Mark (%)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={examData.pass_percentage}
                onChange={(e) => handleExamChange('pass_percentage', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows="2"
              value={examData.description}
              onChange={(e) => handleExamChange('description', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white resize-none focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-6 md:col-span-2 pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-300">
              <input
                type="checkbox"
                checked={examData.is_published}
                onChange={(e) => handleExamChange('is_published', e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-slate-950 border-slate-800 rounded focus:ring-0"
              />
              <span>Published (Available to students)</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-300">
              <input
                type="checkbox"
                checked={examData.allow_review}
                onChange={(e) => handleExamChange('allow_review', e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-slate-950 border-slate-800 rounded focus:ring-0"
              />
              <span>Allow Answer Review</span>
            </label>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>Questions & Marking Scheme</span>
            </h2>
            <p className="text-xs text-slate-400">
              {questions.length} Questions • Total Points: {totalPoints}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddQuestion}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>

        {questions.map((q, qIndex) => (
          <div
            key={q.id || qIndex}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-center">
                  Q{qIndex + 1}
                </span>
                <span className="text-sm font-semibold text-white">Question #{qIndex + 1}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-400">Points:</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={q.points}
                    onChange={(e) => handleQuestionChange(qIndex, 'points', e.target.value)}
                    className="w-16 px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  />
                </div>
                <select
                  value={q.question_type}
                  onChange={(e) => handleQuestionChange(qIndex, 'question_type', e.target.value)}
                  className="px-3 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none"
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="true_false">True / False</option>
                  <option value="short_answer">Short Answer</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(qIndex, q.id, q.isNew)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Question Text</label>
              <textarea
                rows="2"
                value={q.question_text}
                onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white resize-none text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Options */}
            {['mcq', 'true_false'].includes(q.question_type) && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Options & Correct Choice
                  </label>
                  {q.question_type === 'mcq' && (
                    <button
                      type="button"
                      onClick={() => handleAddOption(qIndex)}
                      className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add Option</span>
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  {q.options?.map((opt, optIndex) => (
                    <div
                      key={optIndex}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        opt.is_correct
                          ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm shadow-emerald-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Radio / Option Selector */}
                      <button
                        type="button"
                        onClick={() => handleSetCorrectOption(qIndex, optIndex)}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          opt.is_correct
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                            : 'bg-slate-900 text-slate-400 border border-slate-700 hover:border-indigo-400 hover:text-white'
                        }`}
                        title="Click to set this as the correct answer"
                      >
                        <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">
                          {opt.is_correct ? '✓' : String.fromCharCode(65 + optIndex)}
                        </span>
                        <span>{opt.is_correct ? 'Correct' : `Option ${String.fromCharCode(65 + optIndex)}`}</span>
                      </button>

                      {/* Option Text Input */}
                      <input
                        type="text"
                        disabled={q.question_type === 'true_false'}
                        placeholder={`Enter option ${String.fromCharCode(65 + optIndex)} text...`}
                        value={opt.option_text}
                        onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                        className="flex-grow px-3 py-1.5 rounded-lg bg-transparent text-white text-sm focus:outline-none"
                      />

                      {/* Correct Status / Select Button */}
                      {opt.is_correct ? (
                        <span className="text-[11px] font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Correct Answer</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetCorrectOption(qIndex, optIndex)}
                          className="text-[11px] font-medium text-slate-400 hover:text-emerald-400 px-2.5 py-1 rounded-lg hover:bg-emerald-500/10 transition-colors"
                          title="Click to make this option the correct answer"
                        >
                          Mark Correct
                        </button>
                      )}

                      {/* Delete Option Button */}
                      {q.question_type === 'mcq' && q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(qIndex, optIndex)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors ml-1"
                          title="Remove option"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
              <label className="block text-xs font-medium text-slate-400">
                Explanation / Solution Note
              </label>
              <input
                type="text"
                value={q.explanation || ''}
                onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Save */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : 'Save All Changes'}</span>
        </button>
      </div>
    </div>
  );
}
