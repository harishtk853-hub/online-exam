import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, PlusCircle, Trash2, CheckCircle, Clock, 
  HelpCircle, Settings, FileText, Check, Sparkles, BookOpen,
  AlertCircle, Users
} from 'lucide-react';
import examService from '../services/examService';
import groupService from '../services/groupService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export default function CreateExamPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedGroupId = searchParams.get('groupId');
  const { user } = useAuth();
  const isVerifiedFaculty = user?.role === 'admin' || Boolean(user?.is_verified_teacher);

  const { showSuccess, showError } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [groups, setGroups] = useState([]);

  // Exam Meta Details
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    instructions: '',
    category: 'Computer Science',
    group_id: preselectedGroupId || '',
    duration_minutes: 45,
    pass_percentage: 50,
    is_published: false,
    shuffle_questions: false,
    allow_review: true
  });

  useEffect(() => {
    async function loadGroups() {
      try {
        const res = await groupService.getGroups();
        setGroups(res.data || []);
      } catch (err) {
        console.error('Failed to load groups:', err);
      }
    }
    loadGroups();
  }, []);

  // Questions List
  const [questions, setQuestions] = useState([
    {
      id: 'temp-1',
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

  const handleExamChange = (field, value) => {
    if (field === 'title' && value.trim()) {
      setTitleError(false);
    }
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
        id: 'temp-' + Date.now(),
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

  const handleRemoveQuestion = (index) => {
    if (questions.length === 1) {
      showError('Exam must have at least one question');
      return;
    }
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (qIndex, field, value) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[qIndex] = { ...updated[qIndex], [field]: value };
      
      // Auto-set True/False options when switching type
      if (field === 'question_type' && value === 'true_false') {
        updated[qIndex].options = [
          { option_text: 'True', is_correct: true },
          { option_text: 'False', is_correct: false }
        ];
      } else if (field === 'question_type' && value === 'mcq' && updated[qIndex].options.length === 2) {
        updated[qIndex].options = [
          { option_text: '', is_correct: true },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false }
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
        showError('MCQ question requires at least 2 choices');
        return prev;
      }
      updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== optIndex);
      // Ensure at least one is correct
      if (!updated[qIndex].options.some(o => o.is_correct) && updated[qIndex].options.length > 0) {
        updated[qIndex].options[0].is_correct = true;
      }
      return updated;
    });
  };

  const handleSubmit = async (publishNow = false) => {
    if (!examData.title.trim()) {
      setTitleError(true);
      showError('Please provide an exam title at the top of the form.');
      const titleEl = document.getElementById('exam-title-input');
      if (titleEl) {
        titleEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        titleEl.focus();
      }
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        showError(`Question #${i + 1} statement cannot be empty.`);
        const qEl = document.getElementById(`question-input-${i}`);
        if (qEl) {
          qEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          qEl.focus();
        }
        return;
      }
      if (['mcq', 'true_false'].includes(q.question_type)) {
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].option_text.trim()) {
            showError(`Question #${i + 1} Option #${j + 1} cannot be empty.`);
            const optEl = document.getElementById(`option-input-${i}-${j}`);
            if (optEl) {
              optEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              optEl.focus();
            }
            return;
          }
        }
        if (!q.options.some(o => o.is_correct)) {
          showError(`Please mark the correct option for Question #${i + 1}`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      
      // Clean and prepare questions payload
      const cleanedQuestions = questions.map((q, idx) => ({
        question_text: q.question_text.trim(),
        question_type: q.question_type,
        points: Number(q.points) || 1,
        explanation: q.explanation?.trim() || null,
        order_index: idx,
        options: (q.options || []).map((opt, optIdx) => ({
          option_text: opt.option_text ? String(opt.option_text).trim() : '',
          is_correct: Boolean(opt.is_correct),
          order_index: optIdx
        }))
      }));

      // Single atomic request to create exam + all questions
      const finalTotalMarks = Number(examData.total_marks !== undefined && examData.total_marks !== '' ? examData.total_marks : totalPoints) || totalPoints;
      const createRes = await examService.createExam({
        ...examData,
        total_marks: finalTotalMarks,
        group_id: examData.group_id ? Number(examData.group_id) : null,
        is_published: Boolean(publishNow),
        questions: cleanedQuestions
      });

      const createdExam = createRes?.data || createRes || {};
      const title = createdExam.title || examData.title;
      showSuccess(`Exam "${title}" ${publishNow ? 'published' : 'saved as draft'} successfully!`);
      if (examData.group_id) {
        navigate(`/groups/${examData.group_id}`);
      } else {
        navigate('/teacher/dashboard');
      }
    } catch (err) {
      showError(err.message || err.response?.data?.message || 'Failed to create exam');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPoints = questions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);

  if (!isVerifiedFaculty) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-6">
        <Link
          to="/teacher/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Teacher Dashboard</span>
        </Link>

        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-8 sm:p-10 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
          
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Teacher Verification Required</h1>
            <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Unverified teachers cannot create exams. To maintain high academic integrity and quality, faculty verification is required before authoring exams.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-left text-xs text-slate-300 space-y-2">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <span>Status:</span>
              <span className={`px-2 py-0.5 rounded-full font-medium ${
                user?.verification_status === 'rejected'
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
              }`}>
                {user?.verification_status === 'rejected' ? 'Verification Rejected' : 'Pending Verification'}
              </span>
            </div>
            <p className="text-slate-400">
              Please submit your institutional credentials / College ID card on your profile page. Once approved by an administrator, you will have full access to create and publish exams.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/profile"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 transition-all"
            >
              Go to Profile to Verify
            </Link>
            <Link
              to="/teacher/dashboard"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation Top */}
      <div className="flex items-center justify-between">
        <Link
          to={examData.group_id ? `/groups/${examData.group_id}` : '/teacher/dashboard'}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{examData.group_id ? 'Back to Group Space' : 'Back to Teacher Dashboard'}</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] transition-all"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{submitting ? 'Creating...' : 'Save & Publish Exam'}</span>
          </button>
        </div>
      </div>

      {/* Section 1: Exam Settings Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Exam Overview & Settings</h2>
            <p className="text-xs text-slate-400">Configure title, duration, category, and evaluation criteria.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Exam Title <span className="text-rose-400">*</span>
            </label>
            <input
              id="exam-title-input"
              type="text"
              required
              placeholder="e.g. Midterm Assessment: Algorithms & Data Structures"
              value={examData.title}
              onChange={(e) => handleExamChange('title', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl bg-slate-950 border text-white placeholder-slate-500 focus:outline-none transition-colors ${
                titleError 
                  ? 'border-rose-500 ring-1 ring-rose-500 focus:border-rose-500' 
                  : 'border-slate-800 focus:border-indigo-500'
              }`}
            />
            {titleError && (
              <p className="text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Exam title is required to save or publish the exam.</span>
              </p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Assign to Student Group (Optional)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal normal-case">
                Select a group or leave empty to make it available to all students
              </span>
            </label>
            <select
              value={examData.group_id}
              onChange={(e) => handleExamChange('group_id', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- All Students (Public Exams Catalog) --</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.code || `GRP-${g.id}`})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4 md:col-span-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Total Exam Marks
                </label>
                {questions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDistributeMarks}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-medium"
                    title="Distribute total marks equally across all questions"
                  >
                    Auto-split ({Number(((examData.total_marks !== undefined && examData.total_marks !== '') ? examData.total_marks : totalPoints) / questions.length).toFixed(1)}/q)
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  max="10000"
                  value={examData.total_marks !== undefined ? examData.total_marks : totalPoints}
                  onChange={(e) => handleExamChange('total_marks', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold focus:outline-none focus:border-indigo-500 pr-14"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                  Marks
                </span>
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

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Subject / Category
            </label>
            <input
              type="text"
              placeholder="e.g. Mathematics, Science, Engineering"
              value={examData.category}
              onChange={(e) => handleExamChange('category', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Description / Summary
            </label>
            <input
              type="text"
              placeholder="Short summary for students..."
              value={examData.description}
              onChange={(e) => handleExamChange('description', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Instructions for Candidates
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Read each question carefully. No negative marking."
              value={examData.instructions}
              onChange={(e) => handleExamChange('instructions', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 resize-none text-sm"
            />
          </div>

          <div className="md:col-span-2 flex flex-wrap gap-6 pt-2 border-t border-slate-800/80">
            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={examData.shuffle_questions}
                onChange={(e) => handleExamChange('shuffle_questions', e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Shuffle question order for each student</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={examData.allow_review}
                onChange={(e) => handleExamChange('allow_review', e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Allow students to review answers & explanations after submission</span>
            </label>
          </div>
        </div>
      </div>

      {/* Section 2: Visual Question Builder */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              <span>Questions Builder</span>
            </h2>
            <p className="text-xs text-slate-400">
              {questions.length} questions • Total Marks: {totalPoints} pts
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddQuestion}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>

        {questions.map((q, qIndex) => (
          <div
            key={q.id}
            id={`question-block-${qIndex}`}
            className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-6 space-y-5 transition-all shadow-lg"
          >
            {/* Question Header */}
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
                    className="w-16 px-2.5 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <select
                  value={q.question_type}
                  onChange={(e) => handleQuestionChange(qIndex, 'question_type', e.target.value)}
                  className="px-3 py-1 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="true_false">True / False</option>
                  <option value="short_answer">Short Answer</option>
                </select>
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(qIndex)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Remove question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Question Statement <span className="text-rose-400">*</span>
              </label>
              <textarea
                id={`question-input-${qIndex}`}
                rows="2"
                required
                placeholder="Enter your question text here..."
                value={q.question_text}
                onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none text-sm"
              />
            </div>

            {/* Options List for MCQ & True/False */}
            {['mcq', 'true_false'].includes(q.question_type) && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Answer Options (Select the correct choice)
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
                  {q.options.map((opt, optIndex) => (
                    <div
                      key={optIndex}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                        opt.is_correct
                          ? 'bg-emerald-950/30 border-emerald-500/50'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Mark Correct Button */}
                      <button
                        type="button"
                        onClick={() => handleSetCorrectOption(qIndex, optIndex)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          opt.is_correct
                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <CheckCircle className={`w-3.5 h-3.5 ${opt.is_correct ? 'text-white' : 'text-slate-500'}`} />
                        <span>{opt.is_correct ? 'Correct' : `Option ${String.fromCharCode(65 + optIndex)}`}</span>
                      </button>

                      {/* Option Text Input */}
                      <input
                        id={`option-input-${qIndex}-${optIndex}`}
                        type="text"
                        required
                        disabled={q.question_type === 'true_false'}
                        placeholder={`Option ${String.fromCharCode(65 + optIndex)} text...`}
                        value={opt.option_text}
                        onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                        className={`flex-1 px-3 py-1.5 text-sm rounded-lg bg-transparent text-white focus:outline-none placeholder-slate-600 ${
                          q.question_type === 'true_false' ? 'font-medium cursor-not-allowed text-slate-300' : ''
                        }`}
                      />

                      {/* Remove Option (if MCQ and > 2 choices) */}
                      {q.question_type === 'mcq' && q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(qIndex, optIndex)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Remove choice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation Note */}
            <div className="space-y-1.5 pt-2">
              <label className="flex items-center gap-1.5 text-xs text-slate-400">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>Explanation & Solution Note (Shown during review)</span>
              </label>
              <input
                type="text"
                placeholder="Why is this answer correct? (Optional)"
                value={q.explanation}
                onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        ))}

        {/* Add Another Question Button */}
        <button
          type="button"
          onClick={handleAddQuestion}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-slate-400 hover:text-indigo-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Another Question</span>
        </button>
      </div>

      {/* Bottom Floating Submit Bar */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
        <button
          type="button"
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="px-6 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] transition-all"
        >
          Save as Draft
        </button>
        <button
          type="button"
          onClick={() => handleSubmit(true)}
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{submitting ? 'Saving Exam...' : 'Save & Publish Exam'}</span>
        </button>
      </div>
    </div>
  );
}
