import React, { useMemo, useState, useEffect, useRef } from 'react';
import VerifiedIcon from '@mui/icons-material/Verified';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

/**
 * Memoized SVG component for churn probability ring with animation.
 * Prevents SVG recalculation on every render.
 */
const ChurnRingSVG = React.memo(({ churnProbability, ringColor, textColor }) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const pathRef = useRef(null);
  
  useEffect(() => {
    // Animate from 0 to target value
    setAnimatedValue(0);
    const duration = 1000; // 1 second
    const startTime = Date.now();
    const startValue = 0;
    const endValue = churnProbability;
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOut;
      
      setAnimatedValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [churnProbability]);
  
  const strokeDasharray = `${animatedValue}, 100`;
  
  return (
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
          ref={pathRef}
          className={ringColor}
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="currentColor"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          strokeWidth="3"
          style={{ transition: 'stroke-dasharray 0.1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">
        <span className={`text-xl font-black leading-none ${textColor}`}>
          {Math.round(churnProbability)}%
        </span>
        <span className="text-[8px] font-bold text-slate-400 uppercase">Risk</span>
      </div>
    </div>
  );
});

ChurnRingSVG.displayName = 'ChurnRingSVG';

/**
 * CustomerCard component with memoization for performance optimization.
 * Only re-renders when customer data or expansion state changes.
 */
/**
 * Extract top SHAP features for display
 */
function getTopShapFeatures(shapFeatureValues, featureValues, count = 3) {
  if (!shapFeatureValues || Object.keys(shapFeatureValues).length === 0) {
    return [];
  }
  
  // Sort by absolute SHAP value
  const sorted = Object.entries(shapFeatureValues)
    .map(([feature, shapValue]) => ({
      feature,
      shapValue: Math.abs(shapValue),
      value: featureValues?.[feature] || featureValues?.[feature.toLowerCase()] || ''
    }))
    .sort((a, b) => b.shapValue - a.shapValue)
    .slice(0, count);
  
  return sorted;
}

const CustomerCard = ({ customer, isExpanded, onToggle, onViewStrategy }) => {
  const { id, churn_probability, risk_level, reason, strategy, shap_feature_values, feature_values } = customer;
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Memoize risk colors calculation - only recalculates when risk_level or churn_probability changes
  const colors = useMemo(() => {
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
  }, [risk_level, churn_probability]);
  
  // Get top SHAP features for key drivers
  const topFeatures = useMemo(() => {
    return getTopShapFeatures(shap_feature_values, feature_values, 3);
  }, [shap_feature_values, feature_values]);
  
  // Format feature name for display
  const formatFeatureName = (name) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };
  
  // Format feature value for display
  const formatFeatureValue = (value) => {
    if (typeof value === 'number') {
      if (value % 1 === 0) return value.toString();
      return value.toFixed(2);
    }
    return String(value);
  };
  
  return (
    <div
      className={`customer-card bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group outline-none h-fit relative ${
        isExpanded ? 'ring-2 ring-primary border-transparent shadow-xl' : ''
      }`}
      tabIndex={0}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => {
        // Don't toggle if clicking interactive elements (buttons, icons)
        const target = e.target;
        if (
          target.closest('.view-strategy-btn') ||
          target.closest('button') ||
          target.tagName === 'BUTTON' ||
          target.tagName === 'SVG' ||
          target.closest('svg')
        ) {
          return;
        }
        onToggle();
      }}
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
        <ChurnRingSVG
          churnProbability={churn_probability}
          ringColor={colors.ring}
          textColor={colors.text}
        />
      </div>
      
      {/* Key Driver Lines */}
      {topFeatures.length > 0 && (
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center px-2 mb-2">
          {topFeatures.map((item, idx) => (
            <span key={item.feature}>
              {formatFeatureName(item.feature)}: {formatFeatureValue(item.value)}
              {idx < topFeatures.length - 1 && ' · '}
            </span>
          ))}
        </div>
      )}
      
      {/* Hover Tooltip */}
      {showTooltip && (reason || strategy) && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg pointer-events-none">
          {reason && (
            <div className="mb-2">
              <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">Risk Drivers</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{reason}</p>
            </div>
          )}
          {strategy && (
            <div>
              <p className="text-xs font-bold text-primary mb-1">Strategy</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{strategy}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Collapsible Details - Using conditional rendering for react-window compatibility */}
      {/* Content only exists in DOM when expanded, ensuring real height changes */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
          {/* View Customer Profile Button */}
          {onViewStrategy && (
            <div className="pt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewStrategy();
                }}
                className="view-strategy-btn w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary/90 transition-colors"
              >
                <VerifiedIcon className="w-4 h-4" />
                View Customer Profile
              </button>
            </div>
          )}
        </div>
      )}
      
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

// Memoize CustomerCard with custom comparison function
// Only re-render if customer id, expansion state, or customer data changes
export default React.memo(CustomerCard, (prevProps, nextProps) => {
  return (
    prevProps.customer.id === nextProps.customer.id &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.customer.churn_probability === nextProps.customer.churn_probability &&
    prevProps.customer.risk_level === nextProps.customer.risk_level &&
    prevProps.customer.reason === nextProps.customer.reason &&
    JSON.stringify(prevProps.customer.shap_feature_values) === JSON.stringify(nextProps.customer.shap_feature_values) &&
    JSON.stringify(prevProps.customer.feature_values) === JSON.stringify(nextProps.customer.feature_values)
  );
});
