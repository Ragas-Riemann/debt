'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signUp } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/ui/FormInput'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Eye, EyeOff, Sparkles } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const { data, error } = await signUp(email, password)

    console.log("SIGNUP:", data, error)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.replace('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/25">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create account</h1>
          <p className="text-slate-600 mt-2">Start tracking your debts today</p>
          <Badge variant="outline" className="mt-4 bg-emerald-50 text-emerald-700 border-emerald-200">
            Free Forever
          </Badge>
        </div>

        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border-b border-emerald-100">
            <CardTitle className="text-2xl font-bold text-emerald-900 text-center">Sign Up</CardTitle>
            <CardDescription className="text-emerald-700 text-center">
              Create your Debt Tracker account
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              <FormInput
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20"
              />

              <div className="space-y-2">
                <FormInput
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  helperText="Must be at least 6 characters"
                  containerClassName="relative"
                  className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-emerald-400 hover:text-emerald-600 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="space-y-2">
                <FormInput
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ''}
                  containerClassName="relative"
                  className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-emerald-400 hover:text-emerald-600 transition-colors"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4 border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg transition-all duration-300 hover:shadow-xl" 
                disabled={loading || (password !== confirmPassword)}
                size="lg"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>

            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{' '}
                <Link 
                  href="/login" 
                  className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}