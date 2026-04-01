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