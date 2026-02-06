import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DownloadIcon from '@mui/icons-material/Download';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { schemaGroups, datasetSchema, getSchemaByGroup } from '../data/datasetSchema';

function DatasetSchemaPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const isDashboard = location.pathname === '/';
  const isAssistant = location.pathname === '/assistant';
  const isSchema = location.pathname === '/schema';

  /**
   * Generate and download sample CSV file
   */
  const handleDownloadSampleCSV = () => {
    // Sample data rows based on README.md examples
    const headerRow = datasetSchema.map(col => col.name).join(',');
    
    const sampleRows = [
      '7590-VHVEG,Female,0,Yes,No,1,No,No phone service,DSL,No,Yes,No,No,No,No,Month-to-month,Yes,Electronic check,29.85,29.85',
      '5575-GNVDE,Male,0,No,No,34,Yes,No,DSL,Yes,No,Yes,No,No,No,One year,No,Mailed check,56.95,1889.5',
      '3668-QPYBK,Male,1,Yes,Yes,2,Yes,No,Fiber optic,No,No,No,No,No,No,Month-to-month,Yes,Electronic check,103.70,'
    ];
    
    const csvContent = [headerRow, ...sampleRows].join('\n');
    
    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_churn_dataset.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Navigation Pills */}
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

          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Dataset Schema
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base">
              This schema is required for churn prediction, SHAP feature explanations, and LLM-driven business insights. 
              Ensure your CSV file matches this format exactly, including column names (case-sensitive) and value formats.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={handleDownloadSampleCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors"
            >
              <DownloadIcon className="w-5 h-5" />
              Download Sample CSV
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowBackIcon className="w-5 h-5" />
              Back to Dashboard
            </button>
          </div>

          {/* Schema Groups */}
          {schemaGroups.map((group) => {
            const groupColumns = getSchemaByGroup(group.id);
            
            return (
              <div key={group.id} className="mb-12">
                {/* Group Header */}
                <div className="mb-6">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                    {group.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {group.description}
                  </p>
                </div>

                {/* Feature Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupColumns.map((column) => (
                    <div
                      key={column.name}
                      className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
                    >
                      {/* Column Name and Badges */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <code className="text-sm font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                          {column.name}
                        </code>
                        <div className="flex items-center gap-2 shrink-0">
                          {column.required ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider border border-rose-100 dark:border-rose-900/50">
                              Required
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border border-slate-100 dark:border-slate-900/50">
                              Optional
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Data Type */}
                      <div className="mb-3">
                        <span className="px-2 py-1 rounded bg-primary/10 dark:bg-primary/20 text-primary text-xs font-bold">
                          {column.dataType}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-slate-700 dark:text-slate-300 mb-3 leading-relaxed">
                        {column.description}
                      </p>

                      {/* Example Values */}
                      <div className="mb-3">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Example Values
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {column.exampleValues.map((value, idx) => (
                            <code
                              key={idx}
                              className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded"
                            >
                              {String(value)}
                            </code>
                          ))}
                        </div>
                      </div>

                      {/* Why It Matters */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                          Why It Matters
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {column.whyItMatters}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Important Notes Section */}
          <div className="mt-12 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
              Important Notes
            </h3>
            <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <div>
                <p className="font-bold text-slate-900 dark:text-white mb-1">Column Names</p>
                <p>Column names must match exactly (case-sensitive). The CSV must have a header row with these exact column names.</p>
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white mb-1">Categorical Values</p>
                <p>For categorical columns, values must match exactly. Use "Yes" and "No" (with capital Y/N) for binary fields. For internet service-related fields, "No internet service" is a valid value when the customer has no internet.</p>
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white mb-1">Numeric Values</p>
                <p>SeniorCitizen must be 0 or 1 (integer). Tenure must be a non-negative integer (months). MonthlyCharges and TotalCharges should be numeric floats (decimals allowed). TotalCharges may contain empty values.</p>
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white mb-1">File Encoding</p>
                <p>The CSV file should be UTF-8 encoded. Ensure special characters are properly encoded.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DatasetSchemaPage;
