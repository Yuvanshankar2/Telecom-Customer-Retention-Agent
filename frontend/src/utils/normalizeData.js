/**
 * Normalizes customer data from backend API response
 * Combines customer_churn, customer_reasons, and retention_strategies arrays
 * 
 * @param {Object} result - Backend API result containing customer_churn, customer_reasons, retention_strategies
 * @returns {Array} Normalized array of customer objects with id, churn_probability, risk_level, reason, strategy
 */

/**
 * Calculate risk level based on churn probability
 * @param {number} churnProbability - Churn probability percentage (0-100)
 * @returns {string} Risk level: "low", "medium", or "high"
 */
export function calculateRiskLevel(churnProbability) {
  if (churnProbability < 40) return "low";
  if (churnProbability <= 70) return "medium";
  return "high";
}

/**
 * Normalize customer data from backend response
 * Combines arrays by index (assumes same order)
 * 
 * @param {Object} result - Backend API result
 * @param {Array} result.customer_churn - Array of {id, churn_probability}
 * @param {Array} result.customer_reasons - Array of reason strings
 * @param {Array} result.retention_strategies - Array of strategy strings
 * @returns {Array} Normalized customer data
 */
export function normalizeCustomerData(result) {
  const { customer_churn = [], customer_reasons = [], retention_strategies = [] } = result;
  
  // Normalize data by combining arrays by index
  const normalized = customer_churn.map((customer, index) => {
    let churnProbability = typeof customer.churn_probability === 'number' 
      ? customer.churn_probability 
      : parseFloat(customer.churn_probability) || 0;
    if(churnProbability <=1){
      churnProbability = churnProbability * 100;
    }
    return {
      id: customer.id || `customer-${index + 1}`,
      churn_probability: churnProbability,
      risk_level: calculateRiskLevel(churnProbability),
      reason: customer_reasons[index] || '',
      strategy: retention_strategies[index] || '',
    };
  });
  
  return normalized;
}
