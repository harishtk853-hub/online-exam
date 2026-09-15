import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2,
  GraduationCap,
  Briefcase,
  Building2,
  FileText,
  UploadCloud,
  Image as ImageIcon,
  X,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export default function RegisterPage() {
  const [accountType, setAccountType] = useState('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [idCardFile, setIdCardFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const fileInputRef = useRef(null);
  const { register } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  // Password validation indicators
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password && password === passwordConfirmation;

  // File processing for ID Card (PDF / Image)
  const processIdCardFile = (file) => {
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);

    if (!isPdf && !isImage) {
      showError('Please upload an official ID Card as a PDF or Image (.pdf, .jpg, .png, .webp)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showError('File size exceeds the 10MB limit. Please upload a smaller document.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setIdCardFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
        dataUrl: e.target.result,
        isPdf,
        isImage
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processIdCardFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!passwordsMatch) {
      setError('Password confirmation does not match');
      return;
    }

    if (accountType === 'teacher' && !institutionName.trim()) {
      setError('Please enter your College or Institute name.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        role: accountType,
        institution_name: accountType === 'teacher' ? institutionName.trim() : null,
        id_card_filename: accountType === 'teacher' ? idCardFile?.name : null,
        id_card_mimetype: accountType === 'teacher' ? idCardFile?.type : null,
        id_card_data: accountType === 'teacher' ? idCardFile?.dataUrl : null
      });

      if (accountType === 'teacher') {
        showSuccess(`Faculty registration submitted with College ID verification!`);
      } else {
        showSuccess(`Account created successfully! Welcome to Examify.`);
      }
      navigate('/profile', { replace: true });
    } catch (err) {
      const msg = err.message || 'Registration failed. Please review your details.';
      setError(msg);
      if (err.errors) {
        const errorMap = {};
        err.errors.forEach(fe => { errorMap[fe.field] = fe.message; });
        setFieldErrors(errorMap);
      }
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-md w-full glass-card p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        
        {/* Account Type Selector */}
        <div className="space-y-2">
          <label className="block text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
            Account Type
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setAccountType('student')}
              className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                accountType === 'student'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student</span>
            </button>
            <button
              type="button"
              onClick={() => setAccountType('teacher')}
              className={`flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                accountType === 'teacher'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>Staff / Faculty</span>
            </button>
          </div>
        </div>

        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto">
            {accountType === 'student' ? (
              <GraduationCap className="w-6 h-6 text-indigo-400" />
            ) : (
              <Briefcase className="w-6 h-6 text-emerald-400" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {accountType === 'student' ? 'Create Student Account' : 'Register Faculty / Staff'}
          </h1>
          <p className="text-xs text-slate-400">
            {accountType === 'student' 
              ? 'Join the platform as a student to participate in exams and study groups.' 
              : 'Register to access faculty workspaces and academic management.'}
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex flex-col space-y-2">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {error.toLowerCase().includes('already exists') && (
              <div className="pl-6">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                >
                  <span>Click here to sign in with this account instead</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="register-name">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                id="register-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
            {fieldErrors.name && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="register-email">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="register-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={accountType === 'student' ? 'student@example.com' : 'faculty@institution.edu'}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.email}</p>
            )}
          </div>

          {/* Teacher Specific: College / Institution & ID Card Upload */}
          {accountType === 'teacher' && (
            <div className="space-y-3.5 p-3.5 bg-slate-900/90 border border-emerald-500/20 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Faculty Verification Details</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Image or PDF</span>
              </div>

              {/* College / Institution Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1" htmlFor="register-institution">
                  College / Institute Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Building2 className="w-4 h-4 text-emerald-500/70" />
                  </div>
                  <input
                    id="register-institution"
                    type="text"
                    required={accountType === 'teacher'}
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="e.g. Stanford University, MIT, Delhi Tech"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Institute ID Card Upload (Image or PDF) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Upload College / Faculty ID Card <span className="text-emerald-400 font-normal">(PDF or Image)</span>
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processIdCardFile(e.target.files[0]);
                    }
                  }}
                />

                {!idCardFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                      dragActive
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-800 hover:border-emerald-500/50 hover:bg-slate-950/60 bg-slate-950/40'
                    }`}
                  >
                    <UploadCloud className="w-6 h-6 text-emerald-400 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-slate-200">
                      Click to browse or drag & drop ID card
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Supports PDF, PNG, JPG, or WEBP (Max 10MB)
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-emerald-500/30 rounded-xl">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {idCardFile.isPdf ? (
                        <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-800 bg-slate-900">
                          <img
                            src={idCardFile.dataUrl}
                            alt="ID Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="truncate text-left">
                        <span className="text-xs font-bold text-white block truncate">
                          {idCardFile.name}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {idCardFile.isPdf ? 'PDF Document' : 'Image File'} • {idCardFile.size}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIdCardFile(null)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0 ml-2"
                      title="Remove document"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="register-password">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="register-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-rose-400 mt-1">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="register-confirm">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="register-confirm"
                type="password"
                required
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Password Strength Requirements Helper */}
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-400">
            <span className="font-medium text-slate-300 block mb-1">Password Requirements:</span>
            <div className="grid grid-cols-2 gap-1.5">
              <div className={`flex items-center space-x-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>8+ Characters</span>
              </div>
              <div className={`flex items-center space-x-1.5 ${hasUppercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>1+ Uppercase</span>
              </div>
              <div className={`flex items-center space-x-1.5 ${hasLowercase ? 'text-emerald-400' : 'text-slate-500'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>1+ Lowercase</span>
              </div>
              <div className={`flex items-center space-x-1.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>1+ Number</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 px-4 text-white text-sm font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 ${
              accountType === 'student'
                ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
            }`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Create {accountType === 'student' ? 'Student' : 'Faculty'} Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
