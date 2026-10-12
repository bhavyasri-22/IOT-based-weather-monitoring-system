import React from 'react';
import { ArrowUp } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    if (document.documentElement) {
      document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
    if (document.body) {
      document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="w-full mt-12 border-t border-slate-200 bg-white/60 backdrop-blur-md transition-colors">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center gap-4 text-center">

        {/* Navigation Button to Go Up */}
        <button
          type="button"
          onClick={scrollToTop}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-blue-700 shadow-xs hover:shadow-sm transition-all cursor-pointer active:scale-95"
          title="Go to top of page"
        >
          <ArrowUp size={14} />
          <span>Back to top</span>
        </button>

        {/* Divider */}
        <div className="w-16 h-px bg-slate-200" />

        {/* Copyright */}
        <p className="text-xs text-slate-400">
          &copy; {new Date().getFullYear()} IoT Weather Monitoring System. All Rights Reserved.
        </p>

      </div>
    </footer>
  );
}
