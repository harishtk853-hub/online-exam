import React, { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, Activity, Users, School, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function HomePage() {
  const [apiHealth, setApiHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [latency, setLatency] = useState(null);
  const [error, setError] = useState(null);
  const { showSuccess, showError } = useToast();

  const checkHealth = useCallback(async (isManual = false) => {
    try {
      setLoading(true);
      const startTime = performance.now();
      const res = await api.get('/health');
      const endTime = performance.now();
      
      const pingMs = Math.round(endTime - startTime);
      setLatency(pingMs);
      setApiHealth(res.data);
      setError(null);

      if (isManual) {
        showSuccess(`Health check OK (${pingMs}ms latency)`);
      }
    } catch (err) {
      const msg = err.message || 'Failed to connect to Express API';
      setError(msg);
      if (isManual) {
        showError(`API Health Check Failed: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }, [showSuccess, showError]);

  useEffect(() => {
    checkHealth(false);
  }, [checkHealth]);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <ShieldCheck className="w-4 h-4" />
          <span>React + Node.js Foundation</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Next-Generation <br />
          <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
            Online Examination Platform
          </span>
        </h1>
        <p className="text-slate-400 text-base sm:text-lg">
          Secure, scalable assessment engine with role-based policies, institution management, group hierarchies, and real-time proctoring.
        </p>
      </div>

      {/* Backend API Connectivity Status Card */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 shadow-2xl max-w-2xl mx-auto">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">System & API Status</h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300">
              GET /api/health
            </span>
            <button
              onClick={() => checkHealth(true)}
              disabled={loading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh Health"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading && !apiHealth ? (
          <div className="flex items-center justify-center py-6 space-x-3 text-slate-400 text-sm">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Checking Express Backend Connection...</span>
          </div>
        ) : error ? (
          <div className="flex items-start space-x-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Connection Notice</p>
              <p className="text-xs text-rose-300/80 mt-1">{error}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-medium">Express REST API Connected</span>
              </div>
              <div className="flex items-center space-x-2">
                {latency !== null && (
                  <span className="text-xs font-mono text-emerald-400">
                    {latency}ms
                  </span>
                )}
                <span className="text-xs font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-200">
                  {apiHealth?.status?.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Service</span>
                <span className="font-mono text-slate-200 font-medium">{apiHealth?.service}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block mb-1">Database Mode</span>
                <span className="font-mono text-slate-200 font-medium">
                  {apiHealth?.database?.connected ? 'MySQL Connected' : 'Ready (Configured)'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="glass-card rounded-xl p-6 border border-slate-800/80 hover:border-indigo-500/40 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-4 text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">Role & Policy Security</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Strict server-side policy enforcement for students, verified teachers, trusted contributors, and administrators.
          </p>
        </div>

        <div className="glass-card rounded-xl p-6 border border-slate-800/80 hover:border-sky-500/40 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-sky-600/20 border border-sky-500/30 flex items-center justify-center mb-4 text-sky-400">
            <School className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">Institutions & Schools</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Independent institutional domains, school codes, and administrative delegation.
          </p>
        </div>

        <div className="glass-card rounded-xl p-6 border border-slate-800/80 hover:border-emerald-500/40 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">Groups & Memberships</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Hierarchical group management with owners, managers, teachers, invitations, and membership approval workflows.
          </p>
        </div>
      </div>
    </div>
  );
}
