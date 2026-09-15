import React from 'react';
import { Shield, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-indigo-400" />
          <span>Online Examination Platform — Re-architected with React & Node.js</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">Foundation Ready</span>
          </span>
          <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
