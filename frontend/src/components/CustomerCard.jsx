import React from 'react';
import WarningIcon from '@mui/icons-material/Warning';
import VerifiedIcon from '@mui/icons-material/Verified';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


const CustomerCard = ({ customer, isExpanded, onToggle }) => {
  const { id, churn_probability, risk_level, reason, strategy } = customer;
  
  // Calculate stroke-dasharray for circular progress (percentage of 100)
  const circumference = 2 * Math.PI * 15.9155;
  const strokeDashoffset = circumference - (churn_probability / 100) * circumference;
  const strokeDasharray = `${churn_probability}, 100`;
  
  // Determine colors based on risk level
  const getRiskColors = () => {
    switch (risk_level) {
      case 'low':
        return {
          badge: 'bg-green-50 dark:bg-green-900/30 text-risk-low border-green-100 dark:border-green-900/50',
          ring: 'text-risk-low',
          text: 'text-risk-low',
          label: 'Low Risk'
        };
      case 'medium':
        return {
          badge: 'bg-amber-50 dark:bg-amber-900/30 text-risk-medium border-amber-100 dark:border-amber-900/50',
          ring: 'text-risk-medium',
          text: 'text-risk-medium',
          label: 'Medium Risk'
        };
      case 'high':
        return {
          badge: 'bg-rose-50 dark:bg-rose-900/30 text-risk-high border-rose-100 dark:border-rose-900/50',
          ring: 'text-risk-high',
          text: 'text-risk-high',
          label: churn_probability >= 90 ? 'Critical' : 'High Risk'
        };
      default:
        return {
          badge: 'bg-slate-50 dark:bg-slate-900/30 text-slate-600 border-slate-100 dark:border-slate-900/50',
          ring: 'text-slate-600',
          text: 'text-slate-600',
          label: 'Unknown'
        };
    }
  };
  
  const colors = getRiskColors();
  
  return (
    <div
      className={`customer-card bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group outline-none h-fit ${
        isExpanded ? 'ring-2 ring-primary border-transparent shadow-xl' : ''
      }`}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-black text-lg tracking-tight">#{id}</h3>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wide mt-1">
            Customer Profile
          </p>
        </div>
        <span className={`px-2.5 py-1 rounded-full ${colors.badge} text-[10px] font-black uppercase tracking-wider border`}>
          {colors.label}
        </span>
      </div>
      
      {/* Circular Progress Ring */}
      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full churn-ring" viewBox="0 0 36 36">
            <circle
              className="text-slate-100 dark:text-slate-700"
              cx="18"
              cy="18"
              fill="none"
              r="15.9155"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className={colors.ring}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              strokeWidth="3"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className={`text-xl font-black leading-none ${colors.text}`}>
              {Math.round(churn_probability)}%
            </span>
            <span className="text-[8px] font-bold text-slate-400 uppercase">Risk</span>
          </div>
        </div>
      </div>
      
      {/* Collapsible Details */}
      <div className={`customer-details ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}`}>
        <div className="mt-6 space-y-6 pt-6 border-t border-slate-100 dark:border-slate-700">
          {/* Risk Drivers */}
          {reason && (
            <div>
              <div className="flex items-center gap-2 mb-3 text-risk-high">
                <WarningIcon className="w-[18px] h-[18px]" />
                <h4 className="font-black text-[10px] uppercase tracking-widest">Risk Drivers</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-900 dark:text-white">{reason}</span>
              </p>
            </div>
          )}
          
          {/* Strategy */}
          {strategy && (
            <div>
              <div className="flex items-center gap-2 mb-3 text-primary">
                <VerifiedIcon className="w-[18px] h-[18px]" />
                <h4 className="font-black text-[10px] uppercase tracking-widest">Strategy</h4>
              </div>
              <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-3">
                <p className="text-xs italic text-slate-700 dark:text-slate-300">
                  "{strategy}"
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-400">ID: {id}</span>
        <ExpandMoreIcon
          className={`text-primary expand-indicator transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </div>
    </div>
  );
};

export default CustomerCard;
