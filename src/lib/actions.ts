'use server'

import { supabase } from './supabase'
import { Database } from './supabase'

type Debtor = Database['public']['Tables']['debtors']['Row']
type Debt = Database['public']['Tables']['debts']['Row']
type Payment = Database['public']['Tables']['payments']['Row']
type DebtorInsert = Database['public']['Tables']['debtors']['Insert']
type DebtInsert = Database['public']['Tables']['debts']['Insert']
type PaymentInsert = Database['public']['Tables']['payments']['Insert']

// Debtor actions
export async function getDebtors(userId: string) {
  const { data, error } = await supabase
    .from('debtor_summary')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function getDebtor(id: string) {
  const { data, error } = await supabase
    .from('debtor_summary')
    .select('*')
    .eq('id', id)
    .single()
  
  return { data, error }
}

export async function createDebtor(debtor: Omit<DebtorInsert, 'user_id'>, userId: string) {
  const { data, error } = await supabase
    .from('debtors')
    .insert({ ...debtor, user_id: userId })
    .select()
    .single()
  
  return { data, error }
}

export async function updateDebtor(id: string, debtor: Partial<DebtorInsert>) {
  const { data, error } = await supabase
    .from('debtors')
    .update(debtor)
    .eq('id', id)
    .select()
    .single()
  
  return { data, error }
}

export async function deleteDebtor(id: string) {
  const { error } = await supabase
    .from('debtors')
    .delete()
    .eq('id', id)
  
  return { error }
}

// Debt actions
export async function getDebts(debtorId: string) {
  const { data, error } = await supabase
    .from('debts')
    .select('*')
    .eq('debtor_id', debtorId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function createDebt(debt: DebtInsert) {
  const { data, error } = await supabase
    .from('debts')
    .insert(debt)
    .select()
    .single()
  
  return { data, error }
}

export async function deleteDebt(id: string) {
  const { error } = await supabase
    .from('debts')
    .delete()
    .eq('id', id)
  
  return { error }
}

// Payment actions
export async function getPayments(debtId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('debt_id', debtId)
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export async function createPayment(payment: PaymentInsert) {
  const { data, error } = await supabase
    .from('payments')
    .insert(payment)
    .select()
    .single()
  
  return { data, error }
}

export async function deletePayment(id: string) {
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id)
  
  return { error }
}

// Dashboard stats
export async function getDashboardStats(userId: string) {
  const { data, error } = await supabase
    .from('debtor_summary')
    .select('total_debt, remaining_balance, total_paid')
    .eq('user_id', userId)
  
  if (error) return { data: null, error }
  
  const stats = data.reduce((acc, debtor) => ({
    totalDebt: acc.totalDebt + Number(debtor.total_debt),
    totalRemaining: acc.totalRemaining + Number(debtor.remaining_balance),
    totalPaid: acc.totalPaid + Number(debtor.total_paid),
  }), { totalDebt: 0, totalRemaining: 0, totalPaid: 0 })
  
  return { data: stats, error: null }
}
