/**
 * Dataset Schema Definitions
 * 
 * Complete schema for the churn prediction CSV input format.
 * Organized by logical groups for better understanding.
 */

export const schemaGroups = [
  {
    id: 'customer-info',
    name: 'Customer Information',
    description: 'Basic customer demographics and identification'
  },
  {
    id: 'services-usage',
    name: 'Services & Usage',
    description: 'Telecom services and add-on features'
  },
  {
    id: 'contract-billing',
    name: 'Contract & Billing',
    description: 'Contract terms and billing information'
  },
  {
    id: 'payment-outcome',
    name: 'Payment & Outcome',
    description: 'Payment methods and churn status'
  }
];

export const datasetSchema = [
  // Group 1: Customer Information
  {
    name: 'customerID',
    description: 'Unique customer identifier',
    dataType: 'String',
    required: true,
    exampleValues: ['7590-VHVEG', '5575-GNVDE', '3668-QPYBK'],
    whyItMatters: 'Used to track individual customers and link predictions to specific accounts.',
    group: 'customer-info'
  },
  {
    name: 'gender',
    description: 'Customer gender',
    dataType: 'String (Categorical)',
    required: true,
    exampleValues: ['Male', 'Female'],
    whyItMatters: 'Demographic factor that may influence service preferences and retention patterns.',
    group: 'customer-info'
  },
  {
    name: 'SeniorCitizen',
    description: 'Senior citizen status indicator',
    dataType: 'Integer',
    required: true,
    exampleValues: [0, 1],
    whyItMatters: 'Senior customers may have different service needs and retention behaviors, requiring specialized retention strategies.',
    group: 'customer-info'
  },
  {
    name: 'Partner',
    description: 'Whether customer has a partner',
    dataType: 'String (Categorical)',
    required: true,
    exampleValues: ['Yes', 'No'],
    whyItMatters: 'Household composition affects service usage patterns and contract stability. Customers with partners often have higher retention rates.',
    group: 'customer-info'
  },
  {
    name: 'Dependents',
    description: 'Whether customer has dependents',
    dataType: 'String (Categorical)',
    required: true,
    exampleValues: ['Yes', 'No'],
    whyItMatters: 'Family size influences service bundle needs and switching costs, affecting churn probability.',
    group: 'customer-info'
  },
  {
    name: 'tenure',
    description: 'Number of months the customer has been with the company',
    dataType: 'Integer',
    required: true,
    exampleValues: [1, 12, 34, 72],
    whyItMatters: 'Longer tenure typically indicates higher customer loyalty and lower churn risk. New customers (low tenure) are at higher risk.',
    group: 'customer-info'
  },
  
  // Group 2: Services & Usage
  {
    name: 'PhoneService',
    description: 'Whether customer has phone service',
    dataType: 'String (Categorical)',
    required: true,
    exampleValues: ['Yes', 'No'],
    whyItMatters: 'Core service indicator. Customers without phone service may have different usage patterns and retention drivers.',
    group: 'services-usage'
  },
  {
    name: 'MultipleLines',
    description: 'Whether customer has multiple phone lines',
    dataType: 'String (Categorical)',
    required: true,
    exampleValues: ['Yes', 'No', 'No phone service'],
    whyItMatters: 'Indicates household size and service complexity. Multiple lines increase switching costs and reduce churn risk.',
    group: 'services-usage'
  },
  {
    name: 'InternetService',
    description: 'Type of internet service',
    dataType: 'String (Categorical)',
    required: true,
    exampleValues: ['DSL', 'Fiber optic', 'No'],
    whyItMatters: 'Fiber optic customers have significantly higher churn rates (41.9%) compared to DSL (19%) due to pricing sensitivity and competition.',
    group: 'services-usage'
  },
  {
    name: 'OnlineSecurity',
    description: 'Whether customer has online security',
    dataType: 'String (Categorical)',
    required: true,
    exampleValues: ['Yes', 'No', 'No internet service'],
    whyItMatters: 'Add-on service that increases customer engagement and creates switching friction, reducing churn risk.',
    group: 'services-usage'
  },
  {
    name: 'OnlineBackup',
    description: 'Whether customer has online backup',
    dataType: 'String (Categorical)',
    required: true,
    exampleValues: ['Yes', 'No', 'No internet service'],
    whyItMatters: 'Value-added service that increases customer investment in the service ecosystem, improving retention.',
    group: 'services-usage'
  },
  {
    name: 'DeviceProtection',
    description: 'Whether customer has device protection',
    dataType: 'String (Categorical)',
    required: true,
    exampleValues: ['Yes', 'No', 'No internet service'],
    whyItMatters: 'Additional service layer that increases customer dependency and reduces likelihood of switching providers.',
    group: 'services-usage'
  },
  {
    name: 'TechSupport',
    description: 'Whether customer has tech support',
    dataType: 'String (Categorical)',
    required: true,
    exampleValues: ['Yes', 'No', 'No internet service'],
    whyItMatters: 'Support services create stronger customer relationships and provide intervention opportunities to prevent churn.',
    group: 'services-usage'
  },
  {
    name: 'StreamingTV',
    description: 'Whether customer has streaming TV',
    dataType: 'String (Categorical)',
    required: true,
    exampleValues: ['Yes', 'No', 'No internet service'],
    whyItMatters: 'Entertainment bundle component that increases service stickiness and makes switching more complex.',
    group: 'services-usage'
  },
  {
    name: 'StreamingMovies',
    description: 'Whether customer has streaming movies',
    dataType: 'String (Categorical)',
    required: true,
    exampleValues: ['Yes', 'No', 'No internet service'],
    whyItMatters: 'Content bundle feature that enhances service value and creates additional retention leverage.',
    group: 'services-usage'
  },
  
  // Group 3: Contract & Billing
  {
    name: 'Contract',
    description: 'Contract term',
    dataType: 'String (Categorical)',
    required: true,
    exampleValues: ['Month-to-month', 'One year', 'Two year'],
    whyItMatters: 'Month-to-month contracts have significantly higher churn rates (42.7%) compared to annual (11.3%) and two-year (2.8%) contracts. Contract length is a primary churn driver.',
    group: 'contract-billing'
  },
  {
    name: 'PaperlessBilling',
    description: 'Whether customer uses paperless billing',
    dataType: 'String (Categorical)',
    required: true,
    exampleValues: ['Yes', 'No'],
    whyItMatters: 'Digital engagement indicator. Paperless billing users may have different payment behaviors and service interaction patterns.',
    group: 'contract-billing'
  },
  {
    name: 'MonthlyCharges',
    description: 'Monthly charges amount',
    dataType: 'Float',
    required: true,
    exampleValues: [29.85, 56.95, 103.70],
    whyItMatters: 'Pricing sensitivity is a major churn driver. Higher monthly charges increase churn risk, especially for month-to-month customers.',
    group: 'contract-billing'
  },
  {
    name: 'TotalCharges',
    description: 'Total charges amount (may be empty or numeric)',
    dataType: 'Float/String',
    required: false,
    exampleValues: [29.85, 1889.5, ''],
    whyItMatters: 'Cumulative customer value indicator. Higher total charges suggest longer relationship history and lower churn probability.',
    group: 'contract-billing'
  },
  
  // Group 4: Payment & Outcome
  {
    name: 'PaymentMethod',
    description: 'Payment method used',
    dataType: 'String (Categorical)',
    required: true,
    exampleValues: ['Electronic check', 'Mailed check', 'Bank transfer (automatic)', 'Credit card (automatic)'],
    whyItMatters: 'Electronic check users have the highest churn rate (45.3%) compared to automatic payment methods (15-19%). Payment method is a strong churn predictor.',
    group: 'payment-outcome'
  },
  {
    name: 'Churn',
    description: 'Customer churn status',
    dataType: 'String (Categorical)',
    required: true,
    exampleValues: ['Yes', 'No'],
    whyItMatters: 'Target variable for model training. Indicates whether the customer has churned, used to train the prediction model.',
    group: 'payment-outcome'
  }
];

/**
 * Get schema columns by group
 */
export function getSchemaByGroup(groupId) {
  return datasetSchema.filter(col => col.group === groupId);
}

/**
 * Get all required columns
 */
export function getRequiredColumns() {
  return datasetSchema.filter(col => col.required);
}

/**
 * Get all optional columns
 */
export function getOptionalColumns() {
  return datasetSchema.filter(col => !col.required);
}
