/**
 * AI Integration for Debt Tracker with PHP Currency Support
 */

import { AI_CURRENCY_SYSTEM_PROMPT } from './currency';

export interface AISummaryRequest {
  debtorName: string;
  totalDebt: number;
  totalPaid: number;
  remainingBalance: number;
  debts: Array<{
    amount: number;
    description: string;
    created_at: string;
  }>;
  payments: Array<{
    amount: number;
    created_at: string;
  }>;
}

export interface AIPaymentSuggestionRequest {
  debtorName: string;
  remainingBalance: number;
  paymentHistory: Array<{
    amount: number;
    date: string;
  }>;
  averagePayment?: number;
}

export interface AIResponse {
  summary?: string;
  suggestions?: string[];
  analysis?: string;
  recommendations?: string[];
}

/**
 * Generate AI-powered debtor summary with PHP currency formatting
 */
export async function generateDebtorSummary(request: AISummaryRequest): Promise<string> {
  const prompt = `
${AI_CURRENCY_SYSTEM_PROMPT}

Generate a concise summary for this debtor:

Debtor: ${request.debtorName}
Total Debt: ${new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(request.totalDebt)}
Total Paid: ${new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(request.totalPaid)}
Remaining Balance: ${new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(request.remainingBalance)}

Recent Debts:
${request.debts.map(debt => 
  `- ${new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(debt.amount)} - ${debt.description || 'No description'} (${new Date(debt.created_at).toLocaleDateString()})`
).join('\n')}

Recent Payments:
${request.payments.map(payment => 
  `- ${new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(payment.amount)} (${new Date(payment.created_at).toLocaleDateString()})`
).join('\n')}

Provide a brief, professional summary (2-3 sentences) focusing on:
1. Current financial status
2. Payment behavior patterns
3. Key observations

Use PHP currency format (₱) throughout.
`;

  // This would integrate with your AI service (OpenAI, Claude, etc.)
  // For now, return a formatted response
  return generateMockSummary(request);
}

/**
 * Generate AI-powered payment suggestions with PHP currency formatting
 */
export async function generatePaymentSuggestions(request: AIPaymentSuggestionRequest): Promise<string[]> {
  const prompt = `
${AI_CURRENCY_SYSTEM_PROMPT}

Generate payment suggestions for this debtor:

Debtor: ${request.debtorName}
Remaining Balance: ${new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(request.remainingBalance)}
Average Payment: ${request.averagePayment ? new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(request.averagePayment) : 'N/A'}

Payment History:
${request.paymentHistory.map(payment => 
  `- ${new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(payment.amount)} (${new Date(payment.date).toLocaleDateString()})`
).join('\n')}

Provide 3-4 practical payment suggestions considering:
1. Remaining balance
2. Payment history patterns
3. Reasonable payment amounts
4. Timeline for debt completion

Format as bullet points with PHP currency (₱).
`;

  // This would integrate with your AI service
  // For now, return formatted suggestions
  return generateMockSuggestions(request);
}

/**
 * Mock AI summary generator (replace with actual AI integration)
 */
function generateMockSummary(request: AISummaryRequest): string {
  const formatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  });

  const paymentRate = request.totalDebt > 0 ? (request.totalPaid / request.totalDebt) * 100 : 0;
  
  if (paymentRate > 75) {
    return `${request.debtorName} has shown excellent payment progress, having paid ${formatter.format(request.totalPaid)} (${paymentRate.toFixed(1)}%) of their total ${formatter.format(request.totalDebt)} debt. With only ${formatter.format(request.remainingBalance)} remaining, they are on track to complete payments soon.`
  } else if (paymentRate > 50) {
    return `${request.debtorName} has made moderate progress with ${formatter.format(request.totalPaid)} paid (${paymentRate.toFixed(1)}%) of their ${formatter.format(request.totalDebt)} total debt. The remaining ${formatter.format(request.remainingBalance)} requires consistent payment scheduling to ensure timely completion.`
  } else if (paymentRate > 25) {
    return `${request.debtorName} has paid ${formatter.format(request.totalPaid)} (${paymentRate.toFixed(1)}%) of their ${formatter.format(request.totalDebt)} debt, leaving ${formatter.format(request.remainingBalance)} outstanding. Payment consistency needs improvement to avoid prolonged debt duration.`
  } else {
    return `${request.debtorName} has minimal payment progress with only ${formatter.format(request.totalPaid)} paid (${paymentRate.toFixed(1)}%) of their ${formatter.format(request.totalDebt)} total debt. With ${formatter.format(request.remainingBalance)} remaining, immediate attention to payment scheduling is recommended.`
  }
}

/**
 * Mock payment suggestions generator (replace with actual AI integration)
 */
function generateMockSuggestions(request: AIPaymentSuggestionRequest): string[] {
  const formatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  });

  const remaining = request.remainingBalance;
  const avgPayment = request.averagePayment || (remaining * 0.1); // Default to 10% if no average
  
  const suggestions = [
    `Continue with regular payments of ${formatter.format(avgPayment)} to maintain current momentum`,
    `Consider increasing payments to ${formatter.format(Math.min(avgPayment * 1.5, remaining * 0.3))} to accelerate debt completion`,
    `Set up automatic monthly payments of ${formatter.format(Math.ceil(remaining / 12))} to complete within 12 months`
  ];

  if (remaining > 10000) {
    suggestions.push(`Make occasional lump sum payments of ${formatter.format(Math.ceil(remaining * 0.2))} when possible to reduce interest burden`);
  }

  return suggestions;
}

/**
 * Format currency for AI responses (always use PHP)
 */
export function formatCurrencyForAI(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount);
}
