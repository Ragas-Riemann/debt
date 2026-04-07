'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, getCurrentUser, updatePassword } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FormInput } from '@/components/ui/FormInput'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Sidebar } from '@/components/ui/Sidebar'
import { MobileSidebar } from '@/components/ui/MobileSidebar'
import { 
  LogOut, 
  Users, 
  TrendingUp, 
  Home,
  CreditCard,
  Settings as SettingsIcon,
  User,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const sidebarItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home
    },
    {
      title: 'Debtors',
      href: '/dashboard/debtors',
      icon: Users
    },
    {
      title: 'Creditors',
      href: '/dashboard/creditors',
      icon: TrendingUp
    },
    {
      title: 'Payments',
      href: '/dashboard/payments',
      icon: CreditCard
    },
    {
      title: 'Settings',
      href: '/dashboard/settings',
      icon: SettingsIcon
    }
  ]

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    try {
      const { user, error } = await getCurrentUser()

      if (error || !user) {
        router.replace('/login')
        return
      }

      setUser(user)
    } catch (err) {
      console.error("INIT ERROR:", err)
      router.replace('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setPasswordLoading(true)

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('All fields are required')
      setPasswordLoading(false)
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match')
      setPasswordLoading(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long')
      setPasswordLoading(false)
      return
    }

    try {
      const { error } = await updatePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      )

      if (error) {
        setError(error.message || 'Failed to update password')
      } else {
        setSuccess('Password updated successfully!')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (err: any) {
      setError('Something went wrong. Please try again.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F6F7' }}>
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-lg" style={{ color: '#2C3E50' }}>Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F4F6F7' }}>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar items={sidebarItems} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu */}
              <MobileSidebar items={sidebarItems} />
              
              <div>
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#2C3E50' }}>Settings</h1>
                <p className="text-sm text-gray-500 hidden sm:block">
                  Manage your account settings
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="outline" size="sm" className="hidden sm:flex" style={{ color: '#2C3E50' }}>
                <User className="h-4 w-4 mr-2" />
                {user?.email}
              </Button>
              <Button onClick={handleSignOut} variant="outline" size="sm" style={{ color: '#2C3E50' }}>
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-gradient-to-br from-slate-50 via-white to-gray-50 min-h-screen">
          {/* Header */}
          <div className="bg-white border-b border-slate-200/60 backdrop-blur-sm">
            <div className="px-6 py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
                  <p className="text-slate-600 mt-1">Manage your account and security settings</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-slate-600">Account Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-8 space-y-8">
            {/* Change Password Section */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-blue-900">Change Password</CardTitle>
                    <p className="text-blue-700 text-sm mt-1">Update your account password</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <FormInput
                      label="Current Password"
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter your current password"
                      value={passwordData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                      required
                      disabled={passwordLoading}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                    />
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <FormInput
                      label="New Password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      value={passwordData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      required
                      disabled={passwordLoading}
                      helperText="Must be at least 6 characters long"
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                    />
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-2">
                    <FormInput
                      label="Confirm New Password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      required
                      disabled={passwordLoading}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                    />
                  </div>

                  {/* Messages */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="bg-green-50 border-green-200">
                      <AlertDescription className="text-green-700">{success}</AlertDescription>
                    </Alert>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={passwordLoading}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                    >
                      {passwordLoading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Updating Password...
                        </>
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Account Info Section */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-green-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/25">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-green-900">Account Information</CardTitle>
                    <p className="text-green-700 text-sm mt-1">Your account details</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Email Address</span>
                    <span className="text-sm text-gray-900">{user?.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Account Status</span>
                    <span className="text-sm text-green-600 font-medium">Active</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-sm font-medium text-gray-600">Last Login</span>
                    <span className="text-sm text-gray-900">Just now</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
