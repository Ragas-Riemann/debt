/**
 * Currency formatting utilities for Philippine Peso
 */

export const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '₱0.00';
  }
  
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

export const formatCurrencyCompact = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '₱0';
  }
  
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

// AI System Prompt for PHP Currency
export const AI_CURRENCY_SYSTEM_PROMPT = `
IMPORTANT CURRENCY RULES:
- ALWAYS use Philippine Peso (PHP)
- Symbol: ₱
- Format: ₱1,500.00
- NEVER use dollar sign ($)
- NEVER use USD
- All monetary values must be in PHP

Examples:
- Correct: ₱1,500.00, ₱500.50, ₱10,000
- Incorrect: $1,500.00, $500.50, $10,000

When discussing money, debts, payments, or any financial values:
- Use PHP currency format
- Include the ₱ symbol
- Use proper decimal formatting
- Refer to Philippine Peso as "peso" or "PHP"

This is a Philippine Debt Tracker application - all financial data is in Philippine Peso.
`;
