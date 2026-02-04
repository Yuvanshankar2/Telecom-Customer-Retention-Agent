import React, { useMemo } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import VerifiedIcon from '@mui/icons-material/Verified';

/**
 * CustomerProfileDrawer component displays detailed customer information
 * including SHAP feature attributions, risk explanation, and retention strategy.
 */
function CustomerProfileDrawer({ customer, isOpen, onClose }) {
  if (!isOpen || !customer) return null;

  const { id, churn_probability, risk_level, reason, strategy, shap_feature_values, feature_values } = customer;

  // Get top SHAP features for chart (8-10 features)
  const topShapFeatures = useMemo(() => {
    if (!shap_feature_values || Object.keys(shap_feature_values).length === 0) {
      return [];
    }

    return Object.entries(shap_feature_values)
      .map(([feature, shapValue]) => ({
        feature,
        shapValue: typeof shapValue === 'number' ? shapValue : parseFloat(shapValue) || 0,
        value: feature_values?.[feature] || feature_values?.[feature.toLowerCase()] || ''
      }))
      .sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue))
      .slice(0, 10);
  }, [shap_feature_values, feature_values]);

  // Format feature name for display
  const formatFeatureName = (name) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Get max absolute SHAP value for scaling
  const maxShapValue = useMemo(() => {
    if (topShapFeatures.length === 0) return 1;
    return Math.max(...topShapFeatures.map(f => Math.abs(f.shapValue)));
  }, [topShapFeatures]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white dark:bg-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Customer Profile
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                ID: {id} · {Math.round(churn_probability)}% Churn Risk
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Close drawer"
            >
              <CloseIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* SHAP Feature Chart */}
          {topShapFeatures.length > 0 && (
            <div className="mb-8 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-black text-sm uppercase tracking-widest text-slate-900 dark:text-white mb-4">
                Feature Impact Analysis
              </h3>
              <div className="space-y-3">
                {topShapFeatures.map((item) => {
                  const isPositive = item.shapValue > 0;
                  const barWidth = (Math.abs(item.shapValue) / maxShapValue) * 100;
                  
                  return (
                    <div key={item.feature} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {formatFeatureName(item.feature)}
                        </span>
                        <span className={`font-bold ${isPositive ? 'text-risk-high' : 'text-risk-low'}`}>
                          {item.shapValue > 0 ? '+' : ''}{item.shapValue.toFixed(3)}
                        </span>
                      </div>
                      <div className="relative h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isPositive ? 'bg-risk-high' : 'bg-risk-low'
                          }`}
                          style={{
                            width: `${barWidth}%`,
                            marginLeft: isPositive ? '0' : 'auto',
                            marginRight: isPositive ? 'auto' : '0'
                          }}
                        />
                      </div>
                      {item.value && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Value: {String(item.value)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-risk-high rounded"></div>
                  <span>Increases Churn</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-risk-low rounded"></div>
                  <span>Reduces Churn</span>
                </div>
              </div>
            </div>
          )}

          {/* Risk Explanation */}
          {reason && (
            <div className="mb-8 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3 text-risk-high">
                <WarningIcon className="w-[18px] h-[18px]" />
                <h3 className="font-black text-[10px] uppercase tracking-widest">Risk Drivers</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-900 dark:text-white">{reason}</span>
              </p>
            </div>
          )}

          {/* Retention Strategy */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <VerifiedIcon className="w-6 h-6 text-primary" />
              <h3 className="font-black text-sm uppercase tracking-widest text-primary">
                Retention Strategy
              </h3>
            </div>
            <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-4">
              <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
                {strategy || 'No retention strategy available for this customer.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CustomerProfileDrawer;
