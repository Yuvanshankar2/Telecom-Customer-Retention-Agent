import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedIcon from '@mui/icons-material/Verified';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Chatbot from '../components/Chatbot';

function RetentionStrategyPage() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get customer data from route state
  const customer = location.state?.customer;

  // If customer data is not available, redirect to home
  React.useEffect(() => {
    if (!customer) {
      navigate('/', { replace: true });
    }
  }, [customer, navigate]);

  if (!customer) {
    return null; // Will redirect via useEffect
  }

  const { id, strategy } = customer;

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
          <div className="flex-1"></div>

          {/* Actions - Keep upload button accessible */}
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
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 mb-6 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
          >
            <ArrowBackIcon className="w-5 h-5" />
            <span className="font-medium">Back to Customer List</span>
          </button>

          {/* Customer Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Retention Strategy
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Customer ID: <span className="font-bold text-slate-900 dark:text-white">{id}</span>
            </p>
          </div>

          {/* Retention Strategy Card */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-8">
            <div className="flex items-center gap-3 mb-6">
              <VerifiedIcon className="w-6 h-6 text-primary" />
              <h3 className="font-black text-sm uppercase tracking-widest text-primary">
                Retention Strategy
              </h3>
            </div>
            
            <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-6">
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
                {strategy || 'No retention strategy available for this customer.'}
              </p>
            </div>
          </div>

          {/* Chatbot Section */}
          <Chatbot />
        </div>
      </main>
    </div>
  );
}

export default RetentionStrategyPage;
