import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Chatbot from '../components/Chatbot';

function KnowledgeAssistantPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname === '/';
  const isAssistant = location.pathname === '/assistant';
  const isSchema = location.pathname === '/schema';

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased h-screen flex flex-col">
      {/* Header */}
      <header className="shrink-0 sticky top-0 z-50 w-full bg-white/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-primary p-1.5 rounded-lg text-white">
              <AnalyticsIcon className="block w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight hidden md:block">
              Customer Retention Intelligence
            </h1>
          </div>

          {/* Empty space for centering */}
          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 relative text-slate-600 dark:text-slate-400">
              <NotificationsIcon className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scroll-smooth scrollbar-hide">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Knowledge Assistant
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Ask domain-specific questions about telecom plans, devices, churn drivers, KPIs, and retention best practices.
            </p>
          </div>

          {/* Navigation Pills (reuse existing pill style) */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => navigate('/')}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-bold shadow-md transition-colors ${
                isDashboard
                  ? 'bg-primary text-white shadow-primary/20'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/assistant')}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-bold shadow-md transition-colors ${
                isAssistant
                  ? 'bg-primary text-white shadow-primary/20'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50'
              }`}
            >
              Knowledge Assistant
            </button>
            <button
              onClick={() => navigate('/schema')}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-bold shadow-md transition-colors ${
                isSchema
                  ? 'bg-primary text-white shadow-primary/20'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50'
              }`}
            >
              Dataset Schema
            </button>
          </div>

          {/* Chatbot */}
          <Chatbot />
        </div>
      </main>
    </div>
  );
}

export default KnowledgeAssistantPage;

