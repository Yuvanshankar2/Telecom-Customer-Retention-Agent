import React from 'react';

/**
 * Calculate KPIs from normalized customer data
 * @param {Array} customers - Normalized customer data array
 * @returns {Object} KPI values
 */
export function calculateKPIs(customers) {
  if (!customers || customers.length === 0) {
    return {
      criticalRisks: 0,
      avgScore: 0,
      retentionSuccess: 0,
      monthlyMRRAtRisk: 0,
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
  
  // Monthly MRR at Risk: estimated value (assuming average $50/month per customer)
  // In real scenario, this would come from customer data
  const avgMonthlyCharge = 50; // Estimated average monthly charge
  const monthlyMRRAtRisk = customers.reduce(
    (sum, customer) => sum + (customer.churn_probability / 100) * avgMonthlyCharge,
    0
  );
  
  return {
    criticalRisks,
    avgScore: Math.round(avgScore * 10) / 10, // Round to 1 decimal place
    retentionSuccess: Math.round(retentionSuccess),
  };
}

const KPICards = ({ customers }) => {
  const { criticalRisks, avgScore, retentionSuccess } = calculateKPIs(customers);
  
  const formatMRR = (value) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`;
    }
    return `$${value}`;
  };
  
  return (
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
    </div>
  );
};

export default KPICards;
