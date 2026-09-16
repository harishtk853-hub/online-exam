import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LogIn, 
  Mail, 
  Lock, 
  AlertCircle, 
  ArrowRight, 
  GraduationCap, 
  Briefcase, 
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

const ROLE_TABS = [
  {
    id: 'student',
    label: 'Student',
    tag: 'Student Portal',
    icon: GraduationCap,
    color: 'indigo',
    borderColor: 'border-indigo-500/40',
    bgBadge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    activeTabClass: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30',
    heading: 'Student Sign In',
    description: 'Access scheduled examinations, take assessments, view your scores and course groups.',
    placeholder: 'student@example.com'
  },
  {
    id: 'teacher',
    label: 'Staff / Teacher',
    tag: 'Faculty & Staff Portal',
    icon: Briefcase,
    color: 'emerald',
    borderColor: 'border-emerald-500/40',
    bgBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    activeTabClass: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30',
    heading: 'Staff & Faculty Sign In',
    description: 'Create and schedule exams, manage question repositories, evaluate submissions and monitor classes.',
    placeholder: 'faculty@institution.edu'
  },
  {
    id: 'admin',
    label: 'Administrator',
    tag: 'Admin Portal',
    icon: ShieldCheck,
    color: 'purple',
    borderColor: 'border-purple-500/40',
    bgBadge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    activeTabClass: 'bg-purple-600 text-white shadow-lg shadow-purple-600/30',
    heading: 'Administrator Sign In',
    description: 'Manage institutional accounts, configure system security, assign permissions and audit platforms.',
    placeholder: 'admin@examify.org'
  }
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const activeTabConfig = ROLE_TABS.find(t => t.id === selectedRole) || ROLE_TABS[0];
  const TabIcon = activeTabConfig.icon;

  const from = location.state?.from?.pathname || '/profile';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      const userRole = user?.role || 'user';

      if (userRole === selectedRole || (selectedRole === 'teacher' && userRole === 'teacher')) {
        showSuccess(`Welcome back! Logged in to the ${activeTabConfig.label} portal.`);
      } else {
        showInfo(`Signed in successfully as ${userRole.toUpperCase()}. Redirecting to your dashboard...`);
      }
      
      const roleDefaultPaths = {
        admin: '/admin',
        teacher: '/teacher/dashboard',
        student: '/exams'
      };
      const destination = location.state?.from?.pathname || roleDefaultPaths[userRole] || '/profile';
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-lg w-full glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        
        {/* Role Portal Selector Tabs */}
        <div className="space-y-2">
          <label className="block text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
            Select Your Portal
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800">
            {ROLE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedRole === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(tab.id);
                    setError(null);
                  }}
                  className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? tab.activeTabClass
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Role Header Banner */}
        <div className="text-center space-y-2 pt-1">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold border mb-1 transition-all">
            <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-xs font-semibold ${activeTabConfig.bgBadge}`}>
              <TabIcon className="w-3.5 h-3.5" />
              <span>{activeTabConfig.tag}</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {activeTabConfig.heading}
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            {activeTabConfig.description}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="login-email">
              {activeTabConfig.label} Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={activeTabConfig.placeholder}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300" htmlFor="login-password">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Sign In to {activeTabConfig.label}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>


        {/* Footer Navigation */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>Don't have an account yet?</span>
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Create an Account →
          </Link>
        </div>
      </div>
    </div>
  );
}
