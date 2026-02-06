import React from 'react';

/**
 * Calculate KPIs from normalized customer data
 * @param {Array} customers - Normalized customer data array
 * @returns {Object} KPI values
 */
export function calculateKPIs(customers) {
  // Debug logging
  console.log('[DEBUG] calculateKPIs called with', customers?.length, 'customers');
  
  if (!customers || customers.length === 0) {
    return {
      criticalRisks: 0,
      avgScore: 0,
      retentionSuccess: 0,
      totalCustomers: 0,
      riskDistribution: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
    };
  }
  
  // Critical Risks: count customers with risk_level === "high" AND churn_probability >= 90
  const criticalRisks = customers.filter(
    (customer) => customer.risk_level === 'high' && customer.churn_probability >= 90
  ).length;
  
  // Avg Score: average of all churn_probability values
  const avgScore = customers.reduce((sum, customer) => sum + customer.churn_probability, 0) / customers.length;
  
  // Retention Success: percentage of customers with risk_level === "low"
  const lowRiskCount = customers.filter((customer) => customer.risk_level === 'low').length;
  const retentionSuccess = (lowRiskCount / customers.length) * 100;
  
  // Risk Distribution
  const riskDistribution = {
    critical: customers.filter((c) => c.risk_level === 'high' && c.churn_probability >= 90).length,
    high: customers.filter((c) => c.risk_level === 'high' && c.churn_probability >= 70 && c.churn_probability < 90).length,
    medium: customers.filter((c) => c.risk_level === 'medium').length,
    low: customers.filter((c) => c.risk_level === 'low').length,
  };
  
  return {
    criticalRisks,
    avgScore: Math.round(avgScore * 10) / 10, // Round to 1 decimal place
    retentionSuccess: Math.round(retentionSuccess),
    totalCustomers: customers.length,
    riskDistribution,
  };
}

const KPICards = ({ customers }) => {
  const { criticalRisks, avgScore, retentionSuccess, totalCustomers, riskDistribution } = calculateKPIs(customers);
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Critical Risks */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Critical Risks
          </p>
          <p className="text-xl font-black text-risk-high">{criticalRisks}</p>
        </div>
        
        {/* Avg Score */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Avg Risk of Churn
          </p>
          <p className="text-xl font-black">{avgScore}%</p>
        </div>
        
        {/* Retention Success */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Low Risk Customers
          </p>
          <p className="text-xl font-black text-risk-low">{retentionSuccess}%</p>
        </div>
        
        {/* Total Customers */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Total Customers
          </p>
          <p className="text-xl font-black">{totalCustomers}</p>
        </div>
      </div>
      
      {/* Risk Distribution */}
      {customers.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Risk Distribution
          </p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Critical:</span>
              <span className="text-sm font-black text-risk-high">{riskDistribution.critical}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">High:</span>
              <span className="text-sm font-black text-risk-high">{riskDistribution.high}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Medium:</span>
              <span className="text-sm font-black text-risk-medium">{riskDistribution.medium}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Low:</span>
              <span className="text-sm font-black text-risk-low">{riskDistribution.low}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPICards;
