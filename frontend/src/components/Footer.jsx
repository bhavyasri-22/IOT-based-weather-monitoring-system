import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full mt-12 border-t border-slate-200/80 dark:border-white/[0.08] transition-colors">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center gap-6 text-center">

        {/* Project Title
        <h2 className="text-base sm:text-lg font-extrabold tracking-widest uppercase text-slate-900 dark:text-white">
          IOT - Weather Monitoring System
        </h2> */}

        {/* Names and course info */}
        {/* <div className="flex flex-col items-center gap-1 text-sm sm:text-base text-slate-700 dark:text-[#CBD5E1]">
          <p className="text-xs text-slate-500 dark:text-[#64748B] font-medium uppercase tracking-wider mb-1">by</p>
          <span className="font-semibold text-slate-800 dark:text-[#E2E8F0]">C Thanmai Sai</span>
          <span className="font-semibold text-slate-800 dark:text-[#E2E8F0]">Mili Dholaria</span>
          <span className="font-semibold text-slate-800 dark:text-[#E2E8F0]">Thota Bhavya Sri</span>

          <p className="mt-3 text-xs sm:text-sm text-slate-500 dark:text-[#64748B]">
            under <span className="font-semibold text-slate-700 dark:text-[#94A3B8]">IT 303 Course</span> by{' '}
            <span className="font-semibold text-slate-700 dark:text-[#94A3B8]">Prof. Jaidhar C D</span>
          </p>
        </div> */}

        {/* Divider */}
        <div className="w-24 h-px bg-slate-200 dark:bg-white/10" />

        {/* Copyright */}
        <p className="text-xs text-slate-400 dark:text-[#475569]">
          &copy; {new Date().getFullYear()} All Rights Reserved.
        </p>

      </div>
    </footer>
  );
}
