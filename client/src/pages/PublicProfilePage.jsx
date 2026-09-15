import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Shield, CheckCircle, Award, Lock, ArrowLeft, Calendar, Globe } from 'lucide-react';
import api from '../services/api';

export default function PublicProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError(null);
      setIsPrivate(false);

      try {
        const response = await api.get(`/users/${id}/profile`);
        if (response.success && response.data?.profile) {
          setProfile(response.data.profile);
        }
      } catch (err) {
        if (err.status === 403) {
          setIsPrivate(true);
        } else if (err.status === 404) {
          setError('User profile does not exist.');
        } else {
          setError(err.message || 'Failed to load profile.');
        }
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-medium">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (isPrivate) {
    return (
      <div className="py-16 px-4 max-w-md mx-auto text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Private Profile</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            This user has chosen to keep their profile private. Only authorized personnel can view private profile details.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="py-16 px-4 max-w-md mx-auto text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Profile Not Available</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {error || 'Unable to retrieve user information.'}
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
      </div>

      <div className="glass-card p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-600/30">
              {profile.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                {profile.is_verified_teacher && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Verified Teacher</span>
                  </span>
                )}
                {profile.is_trusted_contributor && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Award className="w-3.5 h-3.5" />
                    <span>Trusted Contributor</span>
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-4 text-xs text-slate-400 mt-1">
                <span className="flex items-center space-x-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Public Profile</span>
                </span>
                {profile.created_at && (
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {profile.roles?.map((r) => (
              <span
                key={r.name}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold uppercase ${
                  r.is_primary
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {r.name} {r.is_primary && '(Primary)'}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">About</h2>
          <p className="text-sm text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 leading-relaxed">
            {profile.bio || 'No biography has been added by this user.'}
          </p>
        </div>
      </div>
    </div>
  );
}
