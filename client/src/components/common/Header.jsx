import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, LogIn, UserPlus, LogOut, LayoutDashboard, 
  PlusCircle, Award, Compass, Users, ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { showInfo } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    showInfo('You have been logged out.');
    navigate('/login');
  };

  const isTeacherOrAdmin = user && (user.role === 'teacher' || user.role === 'admin' || user.role === 'moderator');

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Examify
            </span>
            <span className="text-[10px] block text-indigo-400 font-medium tracking-wide">
              Online Examination Platform
            </span>
          </div>
        </Link>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {isAuthenticated && (
            <>
              <Link
                to="/exams"
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  location.pathname === '/exams'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Compass className="w-4 h-4 text-indigo-400" />
                <span>Exams Catalog</span>
              </Link>

              <Link
                to="/groups"
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  location.pathname.startsWith('/groups')
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Groups & Classes</span>
              </Link>
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20'
                      : 'text-purple-300 hover:text-white hover:bg-purple-500/10'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Admin Console</span>
                </Link>
              )}

              {isTeacherOrAdmin ? (
                <>
                  <Link
                    to="/teacher/dashboard"
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      location.pathname.startsWith('/teacher/dashboard')
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                    <span>Teacher Dashboard</span>
                  </Link>
                  {(user?.role === 'admin' || user?.is_verified_teacher) && (
                    <Link
                      to="/teacher/exams/create"
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-all ml-1"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Create Exam</span>
                    </Link>
                  )}
                </>
              ) : (
                <Link
                  to="/my-attempts"
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    location.pathname === '/my-attempts'
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Award className="w-4 h-4 text-indigo-400" />
                  <span>My Results</span>
                </Link>
              )}
            </>
          )}
        </div>

        {/* Right User Actions */}
        <nav className="flex items-center space-x-3">
          {isAuthenticated && user ? (
            <div className="flex items-center space-x-3">
              <Link
                to="/profile"
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 text-slate-200 transition-colors"
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                  user.role === 'admin'
                    ? 'bg-purple-600'
                    : user.role === 'teacher'
                    ? 'bg-emerald-600'
                    : 'bg-indigo-600'
                }`}>
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-xs font-medium text-white">{user.name}</span>
                <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded font-semibold ${
                  user.role === 'teacher'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : user.role === 'admin'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-indigo-500/20 text-indigo-300'
                }`}>
                  {user.role}
                </span>
                {user.role === 'teacher' && (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    user.is_verified_teacher
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : user.verification_status === 'rejected'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      user.is_verified_teacher
                        ? 'bg-emerald-400'
                        : user.verification_status === 'rejected'
                        ? 'bg-rose-400'
                        : 'bg-amber-400 animate-pulse'
                    }`} />
                    {user.is_verified_teacher
                      ? 'Verified'
                      : user.verification_status === 'rejected'
                      ? 'Rejected'
                      : 'Unverified'}
                  </span>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors duration-150"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/30 transition-all duration-150"
              >
                <UserPlus className="w-4 h-4" />
                <span>Get Started</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
