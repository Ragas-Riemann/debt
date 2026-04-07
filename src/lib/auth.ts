import { supabase } from './supabase'

// ✅ SIGN UP
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  return { data, error }
}

// ✅ SIGN IN
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

// ✅ SIGN OUT
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// ✅ GET CURRENT USER
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()

  return {
    user: data?.user ?? null,
    error,
  }
}

// ✅ GET SESSION (VERY IMPORTANT FOR DEBUGGING)
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()

  return {
    session: data?.session ?? null,
    error,
  }
}

// ✅ UPDATE PASSWORD
export async function updatePassword(currentPassword: string, newPassword: string) {
  try {
    // First verify the current password by attempting to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: (await supabase.auth.getUser()).data.user?.email || '',
      password: currentPassword
    })

    if (signInError) {
      return { error: { message: 'Current password is incorrect' } }
    }

    // If current password is correct, update to new password
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    return { data, error }
  } catch (error: any) {
    return { error: { message: error.message || 'Failed to update password' } }
  }
}