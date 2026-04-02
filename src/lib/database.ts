import { supabase } from './supabase'

// Types matching the new SQL schema
export interface User {
  id: string
  email: string
  created_at: string
}

export interface DebtRequest {
  id: string
  from_user_id: string
  to_user_id: string
  type: 'debtor' | 'creditor'
  amount: number
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  from_user?: User
  to_user?: User
}

export interface Creditor {
  id: string
  debtor_id: string
  creditor_id: string
  amount: number
  status: 'active' | 'paid'
  created_at: string
  debtor?: User
  creditor?: User
}

// Get all users except current user (for selection)
export async function getUsersForSelection(currentUserId: string): Promise<{ data: User[] | null, error: any }> {
  try {
    console.log('getUsersForSelection called with currentUserId:', currentUserId)
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email, created_at')
      .neq('id', currentUserId)
      .order('email')

    console.log('Supabase query result:', { data, error })

    if (error) {
      console.error('Supabase error:', error)
    } else {
      console.log('Users found:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('First few users:', data.slice(0, 3))
      }
    }

    return { data, error }
  } catch (error) {
    console.error('Exception in getUsersForSelection:', error)
    return { data: null, error }
  }
}

// Create debt request
export async function createDebtRequest(
  fromUserId: string, 
  toUserId: string, 
  type: 'debtor' | 'creditor', 
  amount: number
): Promise<{ data: DebtRequest | null, error: any }> {
  try {
    const { data, error } = await supabase
      .from('debt_requests')
      .insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        type,
        amount,
        status: 'pending'
      })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Check for existing requests
export async function checkExistingRequest(
  fromUserId: string, 
  toUserId: string, 
  type: 'debtor' | 'creditor'
): Promise<{ data: DebtRequest | null, error: any }> {
  try {
    const { data, error } = await supabase
      .from('debt_requests')
      .select('*')
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', toUserId)
      .eq('type', type)
      .in('status', ['pending', 'accepted'])
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Get pending requests for current user
export async function getPendingRequests(userId: string): Promise<{ data: DebtRequest[] | null, error: any }> {
  try {
    const { data, error } = await supabase
      .from('debt_requests')
      .select(`
        *,
        from_user:users!debt_requests_from_user_id_fkey(id, email),
        to_user:users!debt_requests_to_user_id_fkey(id, email)
      `)
      .or(`to_user_id.eq.${userId},from_user_id.eq.${userId}`)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Accept debt request (triggers will handle creditor creation)
export async function acceptDebtRequest(requestId: string): Promise<{ data: DebtRequest | null, error: any }> {
  try {
    const { data, error } = await supabase
      .from('debt_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Reject debt request
export async function rejectDebtRequest(requestId: string): Promise<{ data: DebtRequest | null, error: any }> {
  try {
    const { data, error } = await supabase
      .from('debt_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Get approved debtors (people who owe current user)
export async function getApprovedDebtors(userId: string): Promise<{ data: Creditor[] | null, error: any }> {
  try {
    const { data, error } = await supabase
      .from('creditors')
      .select(`
        *,
        debtor:users!creditors_debtor_id_fkey(id, email)
      `)
      .eq('creditor_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Get approved creditors (people current user owes)
export async function getApprovedCreditors(userId: string): Promise<{ data: Creditor[] | null, error: any }> {
  try {
    const { data, error } = await supabase
      .from('creditors')
      .select(`
        *,
        creditor:users!creditors_creditor_id_fkey(id, email)
      `)
      .eq('debtor_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Get current user profile
export async function getCurrentUserProfile(userId: string): Promise<{ data: User | null, error: any }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}

// Create user profile (if doesn't exist)
export async function createUserProfile(email: string): Promise<{ data: User | null, error: any }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({ email })
      .select()
      .single()

    return { data, error }
  } catch (error) {
    return { data: null, error }
  }
}
