import React from 'react';
import { useNavigate } from 'react-router-dom';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SortIcon from '@mui/icons-material/Sort';
import { useApp } from '../context/AppContext';
import FileUpload from '../components/FileUpload';
import CustomerCard from '../components/CustomerCard';
import KPICards from '../components/KPICards';

/**
 * CustomerListPage component displays the main dashboard with customer churn data.
 * All state is managed by AppContext to persist across navigation.
 * This component consumes context state and handles UI rendering only.
 */
function CustomerListPage() {
  const navigate = useNavigate();
  
  // Consume all state from AppContext
  // State persists when navigating away and back because AppProvider remains mounted
  const {
    file,
    loading,
    error,
    setError,
    status,
    normalizedCustomers,
    filteredCustomers,
    activeFilter,
    setActiveFilter,
    expandedCardId,
    setExpandedCardId,
    searchQuery,
    setSearchQuery,
    sortType,
    setSortType,
    handleFileSelect,
  } = useApp();

  /**
   * Toggle expanded state of a customer card
   * @param {string} cardId - The ID of the card to toggle
   */
  const handleCardToggle = (cardId) => {
    setExpandedCardId(expandedCardId === cardId ? null : cardId);
  };

  /**
   * Navigate to retention strategy page for a customer
   * @param {Object} customer - The customer object to view strategy for
   */
  const handleViewStrategy = (customer) => {
    navigate(`/customers/${customer.id}/retention`, { state: { customer } });
  };

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

          {/* Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative group">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors w-[18px] h-[18px]" />
              <input
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                placeholder="Search by ID, Name, or Plan..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 shrink-0">
            <FileUpload file={file} loading={loading} onFileSelect={handleFileSelect} />
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
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Dashboard Title */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Active Risk Monitor
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                  Customers sorted by descending churn probability.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortType('probability-desc')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold shadow-sm transition-colors ${
                    sortType === 'probability-desc'
                      ? 'bg-primary text-white border-primary shadow-primary/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <SortIcon className="w-4 h-4" />
                  Probability: High to Low
                </button>
                <button
                  onClick={() => setSortType('id-asc')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold shadow-sm transition-colors ${
                    sortType === 'id-asc'
                      ? 'bg-primary text-white border-primary shadow-primary/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <SortIcon className="w-4 h-4" />
                  Sort by ID
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <KPICards customers={normalizedCustomers} />
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-800 dark:text-red-200">
              <div className="flex items-center justify-between">
                <span className="font-medium">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Loading Status */}
          {loading && status && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-800 dark:text-blue-200">
              <span className="font-medium">
                Status: {status === 'pending' ? 'Task queued...' : status === 'processing' ? 'Processing pipeline...' : status}
              </span>
            </div>
          )}

          {/* Filter Pills */}
          {normalizedCustomers.length > 0 && (
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide sticky top-[-1px] bg-background-light/95 dark:bg-background-dark/95 backdrop-blur z-40 py-4 border-b border-transparent">
              <button
                onClick={() => setActiveFilter('all')}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-bold shadow-md transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-primary text-white shadow-primary/20'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50'
                }`}
              >
                All Profiles
              </button>
              <button
                onClick={() => setActiveFilter('critical')}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === 'critical'
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50'
                }`}
              >
                Critical (90%+)
              </button>
              <button
                onClick={() => setActiveFilter('high')}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === 'high'
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50'
                }`}
              >
                High Risk (70-90%)
              </button>
              <button
                onClick={() => setActiveFilter('low')}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === 'low'
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50'
                }`}
              >
                Low Risk (&lt;40%)
              </button>
            </div>
          )}

          {/* Customer Cards Grid */}
          {filteredCustomers.length > 0 ? (
            <div className="max-h-[calc(100vh-500px)] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                {filteredCustomers.map((customer) => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    isExpanded={expandedCardId === customer.id}
                    onToggle={() => handleCardToggle(customer.id)}
                    onViewStrategy={() => handleViewStrategy(customer)}
                  />
                ))}
              </div>
            </div>
          ) : loading ? (
            // Loading Skeletons
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="customer-card bg-white/50 dark:bg-slate-800/50 p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 h-fit"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"></div>
                  </div>
                  <div className="flex justify-center py-4">
                    <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-700 animate-pulse"></div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <div className="h-4 w-12 bg-slate-100 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-4 w-20 bg-slate-100 dark:bg-slate-700 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Empty State
            <div className="flex flex-col items-center justify-center gap-4 py-12 border-t border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-500 font-medium">
                {normalizedCustomers.length === 0
                  ? 'Upload a CSV file to begin analysis'
                  : 'No customers match your filters'}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default CustomerListPage;
