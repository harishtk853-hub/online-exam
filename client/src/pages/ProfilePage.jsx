import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Shield, 
  CheckCircle, 
  Award, 
  Lock, 
  Save, 
  KeyRound, 
  AlertCircle, 
  Globe, 
  ExternalLink, 
  Key,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Building2,
  FileText,
  UploadCloud,
  Image as ImageIcon,
  Check,
  RefreshCw,
  XCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';

export default function ProfilePage() {
  const { user, updateProfile, submitTeacherVerification, changePassword } = useAuth();
  const { showSuccess, showError } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isPublic, setIsPublic] = useState(user?.is_public !== undefined ? user.is_public : true);
  const [institutionName, setInstitutionName] = useState(user?.institution_name || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Verification state
  const [idCardFile, setIdCardFile] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setIsPublic(user.is_public !== undefined ? user.is_public : true);
      setInstitutionName(user.institution_name || '');
    }
  }, [user]);

  const handleProcessIdCard = (file) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);

    if (!isPdf && !isImage) {
      showError('Please upload an ID Card as a PDF or Image (.pdf, .jpg, .png, .webp)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showError('File exceeds 10MB limit.');
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

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!institutionName.trim()) {
      showError('Please enter your College or Institute name.');
      return;
    }
    if (!idCardFile && !user.id_card_filename) {
      showError('Please select an ID Card document (PDF or Image) to upload.');
      return;
    }

    setVerifyLoading(true);
    try {
      await submitTeacherVerification({
        institution_name: institutionName.trim(),
        id_card_filename: idCardFile?.name || user.id_card_filename,
        id_card_mimetype: idCardFile?.type || user.id_card_mimetype,
        id_card_data: idCardFile?.dataUrl || null
      });
      showSuccess('Verification document submitted successfully! Under review by administrator.');
      setIdCardFile(null);
    } catch (err) {
      showError(err.message || 'Failed to submit verification.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await updateProfile({ 
        name, 
        bio, 
        is_public: isPublic
      });
      showSuccess('Profile updated successfully!');
    } catch (err) {
      showError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword !== newPasswordConfirm) {
      setPasswordError('New password confirmation does not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirm
      });
      showSuccess('Password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
    } catch (err) {
      const msg = err.message || 'Failed to change password.';
      setPasswordError(msg);
      showError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Profile Overview Header Card */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg ${
            user.role === 'admin' 
              ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-600/30'
              : user.role === 'teacher'
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 shadow-emerald-600/30'
              : 'bg-gradient-to-tr from-indigo-600 to-sky-600 shadow-indigo-600/30'
          }`}>
            {user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{user.name}</h1>
              {user.role === 'teacher' && (
                user.is_verified_teacher ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Verified Teacher</span>
                  </span>
                ) : user.verification_status === 'rejected' ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Verification Rejected</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Unverified Faculty</span>
                  </span>
                )
              )}
              {user.is_trusted_contributor && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Award className="w-3.5 h-3.5" />
                  <span>Trusted Contributor</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user.roles && user.roles.length > 0 ? (
            user.roles.map((r) => (
              <span
                key={r.name}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold uppercase ${
                  r.name === 'teacher'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : r.name === 'admin'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}
              >
                {r.name} {r.is_primary && '(Primary)'}
              </span>
            ))
          ) : (
            <span className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold uppercase ${
              user.role === 'teacher'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : user.role === 'admin'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}>
              Role: {user.role}
            </span>
          )}

          <Link
            to={`/users/${user.id}`}
            className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Profile</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Edit Profile Form */}
        <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <User className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Profile Details & Privacy</h2>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            {/* Account Role Badge (Read-Only) */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Account Role (Assigned)
              </label>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center space-x-2.5">
                  {user.role === 'admin' ? (
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  ) : user.role === 'teacher' ? (
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Briefcase className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-semibold text-white">
                      {user.role === 'teacher' ? 'Staff / Teacher' : user.role === 'admin' ? 'Administrator' : 'Student'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {user.role === 'admin' 
                        ? 'Full platform administration privileges' 
                        : user.role === 'teacher' 
                        ? 'Staff / Faculty exam creation & student management' 
                        : 'Student assessment & exam participation account'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/50 select-none">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Immutable</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Roles are assigned during registration and cannot be changed from the profile. Contact an administrator for role changes.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="profile-name">
                Full Name
              </label>
              <input
                id="profile-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="profile-email">
                Email Address (Permanent)
              </label>
              <input
                id="profile-email"
                type="email"
                disabled
                value={user.email}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="profile-bio">
                Biography / Academic Info
              </label>
              <textarea
                id="profile-bio"
                rows="3"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about your studies or field of focus..."
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Profile Visibility Switch */}
            <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-200">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Public Profile Visibility</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isPublic
                    ? 'Your public profile is visible to other learners and instructors.'
                    : 'Your profile is private and hidden from public searches.'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{profileLoading ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Lock className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Security & Password</h2>
          </div>

          {passwordError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="current-pw">
                Current Password
              </label>
              <input
                id="current-pw"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="new-pw">
                New Password (Min 8 chars, Upper, Lower, Number)
              </label>
              <input
                id="new-pw"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="confirm-new-pw">
                Confirm New Password
              </label>
              <input
                id="confirm-new-pw"
                type="password"
                required
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all border border-slate-700 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <span>{passwordLoading ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </form>

          {/* Assigned Permissions Summary Box */}
          {user.permissions && user.permissions.length > 0 && (
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-400">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                <span>Granted Role Permissions:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {user.permissions.map((perm) => (
                  <span
                    key={perm}
                    className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-[11px] font-mono text-slate-400"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TEACHER / FACULTY ID CARD VERIFICATION SECTION */}
      {user.role === 'teacher' && (
        <div className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>College & Institute Faculty Verification</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Upload your official institution ID card (Image or PDF) to earn certified faculty status and unlock public exam creation.
                </p>
              </div>
            </div>

            {/* Current Verification Status Badge */}
            <div>
              {user.is_verified_teacher ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Verified Faculty Member</span>
                </span>
              ) : user.verification_status === 'rejected' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>Verification Rejected</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Verification Under Admin Review</span>
                </span>
              )}
            </div>
          </div>

          {/* Feedback note if rejected */}
          {user.verification_status === 'rejected' && user.verification_notes && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Administrator Feedback:</span>
                <p className="mt-0.5">{user.verification_notes}</p>
                <p className="text-[11px] text-rose-300/80 mt-1">Please re-upload a clear copy of your College / Institute ID card below.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleVerifySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5" htmlFor="verify-institution">
                  College / University / Institute Name <span className="text-rose-400">*</span>
                </label>
                <input
                  id="verify-institution"
                  type="text"
                  required
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. Stanford University / Delhi Institute of Technology"
                  className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>

              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-200 block">Current Submitted Document:</span>
                <div className="flex items-center gap-2 text-slate-300 font-mono text-xs">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>{user.id_card_filename || 'stanford_faculty_id.pdf'}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Accepted document formats: <strong>PDF (.pdf)</strong>, or Images (<strong>PNG, JPG, JPEG, WEBP</strong>) up to 10MB.
                </p>
              </div>
            </div>

            {/* Document File Dropzone */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Upload / Replace Faculty ID Card Document (Image or PDF)
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleProcessIdCard(e.target.files[0]);
                    }
                  }}
                />

                {!idCardFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/50 bg-slate-950/40 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
                  >
                    <UploadCloud className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-xs font-semibold text-slate-200">
                      Click to choose or replace ID card document
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Upload College ID Card as PDF or high-res Image
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {idCardFile.isPdf ? (
                        <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
                          <FileText className="w-6 h-6" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shrink-0">
                          <img
                            src={idCardFile.dataUrl}
                            alt="ID Document"
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
                      className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={verifyLoading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {verifyLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Submit / Update Verification Document</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
