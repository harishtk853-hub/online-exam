import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Users, ArrowLeft, School, Copy, Check, ShieldCheck, 
  UserCheck, RefreshCw, KeyRound, LogOut, CheckCircle,
  BookOpen, MessageSquare, PlusCircle, Send, Trash2,
  Clock, Award, PlayCircle, Eye, FileText, Sparkles,
  HelpCircle, AlertCircle, MessageCircle
} from 'lucide-react';
import groupService from '../services/groupService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export default function GroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('exams'); // 'exams' | 'chat' | 'members'
  const [copied, setCopied] = useState(false);

  // Group Exams State
  const [exams, setExams] = useState([]);
  const [examsLoading, setExamsLoading] = useState(false);

  // Group Chat State
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatBottomRef = useRef(null);

  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const fetchGroup = async () => {
    try {
      setLoading(true);
      const res = await groupService.getGroupById(id);
      setGroup(res.data);
    } catch (err) {
      showError(err.message || 'Failed to load group details');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      setExamsLoading(true);
      const res = await groupService.getGroupExams(id);
      setExams(res.data || []);
    } catch (err) {
      console.error('Failed to load group exams:', err);
    } finally {
      setExamsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await groupService.getGroupMessages(id);
      setMessages(res.data || []);
    } catch (err) {
      console.error('Failed to load group messages:', err);
    }
  };

  useEffect(() => {
    fetchGroup();
    fetchExams();
  }, [id]);

  // Load chat messages and set up auto-polling when Chat tab is active
  useEffect(() => {
    if (activeTab === 'chat') {
      setChatLoading(true);
      fetchMessages().finally(() => setChatLoading(false));

      const interval = setInterval(() => {
        fetchMessages();
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [id, activeTab]);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (activeTab === 'chat' && messages.length > 0) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, activeTab]);

  const handleCopyCode = () => {
    if (!group?.code) return;
    navigator.clipboard.writeText(group.code);
    setCopied(true);
    showSuccess(`Copied Join Code: ${group.code}`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;
    try {
      await groupService.leaveGroup(id);
      showSuccess('Left group successfully');
      navigate('/groups');
    } catch (err) {
      showError(err.message || 'Failed to leave group');
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    try {
      setSendingMessage(true);
      const res = await groupService.sendGroupMessage(id, newMessage.trim());
      setNewMessage('');
      if (res.data) {
        setMessages(prev => [...prev, res.data]);
      } else {
        await fetchMessages();
      }
    } catch (err) {
      showError(err.message || 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await groupService.deleteGroupMessage(id, messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
      showSuccess('Message deleted');
    } catch (err) {
      showError(err.message || 'Failed to delete message');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-400 text-sm">Loading group space...</p>
      </div>
    );
  }

  if (!group) return null;

  const currentMember = group.members?.find(m => m.user_id === user?.id);
  const isOwner = currentMember?.role === 'owner' || group.created_by === user?.id;
  const isTeacher = currentMember?.role === 'teacher' || user?.role === 'teacher' || isOwner;
  const isMember = Boolean(currentMember);

  const formatMessageTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/groups"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Groups</span>
        </Link>

        {isMember && !isOwner && (
          <button
            onClick={handleLeaveGroup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave Group</span>
          </button>
        )}
      </div>

      {/* Group Header Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {group.school_name && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                  <School className="w-3.5 h-3.5" />
                  <span>{group.school_name}</span>
                </span>
              )}
              <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                {group.visibility}
              </span>
              {isMember && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Enrolled Member
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{group.name}</h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
              {group.description || 'Academic workspace for announcements, exams, and collaborative discussions.'}
            </p>
          </div>

          {/* Big Join Code Box */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-1.5 shrink-0 sm:min-w-[180px]">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">
              Group Join Code
            </span>
            <span className="text-xl font-mono font-extrabold text-amber-400 tracking-wider">
              {group.code}
            </span>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors mt-1"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 text-xs">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('exams')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'exams'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Group Exams</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeTab === 'exams' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {exams.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Group Chat</span>
            {messages.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeTab === 'chat' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                {messages.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'members'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Members</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeTab === 'members' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
              {group.members?.length || 0}
            </span>
          </button>
        </div>

        {/* TAB 1: GROUP EXAMS */}
        {activeTab === 'exams' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Exams for {group.name}</span>
                </h2>
                <p className="text-xs text-slate-400">All tests and assessments curated for this group.</p>
              </div>

              {(isTeacher || isOwner) && (
                <Link
                  to={`/exams/create?groupId=${group.id}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25 active:scale-[0.98] transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Group Exam</span>
                </Link>
              )}
            </div>

            {examsLoading ? (
              <div className="py-12 flex justify-center items-center">
                <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            ) : exams.length === 0 ? (
              <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl p-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">No Group Exams Yet</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Faculty leaders can create group assessments, practice quizzes, and final exams directly assigned to this group.
                  </p>
                </div>
                {(isTeacher || isOwner) && (
                  <Link
                    to={`/exams/create?groupId=${group.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create the First Exam</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exams.map((exam) => (
                  <div
                    key={exam.id}
                    className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {exam.category || 'General'}
                          </span>
                          <h3 className="text-base font-bold text-white leading-tight">
                            {exam.title}
                          </h3>
                        </div>
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                          exam.is_published 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {exam.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>

                      {exam.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {exam.description}
                        </p>
                      )}

                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800/60 text-[11px] text-slate-300">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{exam.duration_minutes} mins</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                          <span>{exam.question_count || 0} Qs</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pass {exam.pass_percentage}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {exam.my_attempt_status === 'completed' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Done ({exam.my_last_percentage}%)</span>
                          </span>
                          <Link
                            to={`/exams/results/${exam.my_last_attempt_id}`}
                            className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                          >
                            Review
                          </Link>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          By {exam.creator_name}
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        {(isTeacher || isOwner) && (
                          <Link
                            to={`/exams/${exam.id}/submissions`}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="View Submissions"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        )}

                        <Link
                          to={`/exams/${exam.id}/take`}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>{exam.my_attempt_status === 'completed' ? 'Retake' : 'Take Exam'}</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GROUP CHAT */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <span>Group Discussion Channel</span>
                </h2>
                <p className="text-xs text-slate-400">Discuss exam questions, assignments, and announcements in real-time.</p>
              </div>
              <button
                onClick={fetchMessages}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
                title="Refresh Chat"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Chat Messages Container */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-6 min-h-[380px] max-h-[480px] overflow-y-auto flex flex-col space-y-4">
              {chatLoading ? (
                <div className="m-auto flex items-center justify-center text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin mr-2" />
                  Loading conversation...
                </div>
              ) : messages.length === 0 ? (
                <div className="m-auto text-center space-y-2 py-8">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-white">No messages yet</p>
                  <p className="text-[11px] text-slate-400">Be the first to post an update or question to this group!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.user_id === user?.id;
                  const canDelete = isMine || isOwner;

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 group ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMine && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                          {msg.user_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      )}

                      <div className={`max-w-[80%] sm:max-w-[70%] space-y-1 ${isMine ? 'items-end' : 'items-start'}`}>
                        {/* Header metadata */}
                        <div className={`flex items-center gap-2 text-[11px] ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <span className="font-semibold text-slate-300">
                            {isMine ? 'You' : msg.user_name}
                          </span>
                          
                          {/* Role Badge */}
                          {msg.member_role === 'owner' ? (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              👑 Owner
                            </span>
                          ) : msg.member_role === 'teacher' || msg.is_verified_teacher ? (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              🎓 Teacher
                            </span>
                          ) : null}

                          <span className="text-[10px] text-slate-500">
                            {formatMessageTime(msg.created_at)}
                          </span>

                          {canDelete && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-0.5"
                              title="Delete message"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Message Bubble */}
                        <div
                          className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isMine
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>

                      {isMine && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                          {user?.name?.charAt(0).toUpperCase() || 'Y'}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Message Input Box */}
            {isMember ? (
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message or question to the group space..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sendingMessage}
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sendingMessage}
                  className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            ) : (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-400">
                You must join this group using the Join Code above to participate in the chat.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MEMBERS */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Group Members ({group.members?.length || 0})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.members?.map((m) => (
                <div
                  key={m.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-sky-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {m.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-white truncate block">{m.name}</span>
                      <span className="text-[11px] text-slate-400 truncate block">{m.email}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                    m.role === 'owner'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : m.role === 'teacher'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
