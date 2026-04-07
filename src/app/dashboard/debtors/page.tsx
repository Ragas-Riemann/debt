'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut, getCurrentUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { DashboardCard } from '@/components/ui/DashboardCard'
import { Sidebar } from '@/components/ui/Sidebar'
import { MobileSidebar } from '@/components/ui/MobileSidebar'
import { getApprovedDebtors } from '@/lib/database'
import { formatCurrency } from '@/lib/currency'
import { DataCache, PerformanceMonitor } from '@/lib/performance'
import { 
  LogOut, 
  Users, 
  TrendingUp, 
  Home,
  CreditCard,
  Settings,
  User,
  Eye,
  ArrowUpRight,
  Bell
} from 'lucide-react'
import { PesoSignIcon } from '@/components/ui/PesoSignIcon'
import { ReminderModal } from '@/components/ReminderModal'
import { DetailsModal } from '@/components/DetailsModal'

export default function DebtorsPage() {
  const [user, setUser] = useState<any>(null)
  const [debtors, setDebtors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [reminderModalOpen, setReminderModalOpen] = useState(false)
  const [selectedDebtor, setSelectedDebtor] = useState<any>(null)
  const [reminderLoading, setReminderLoading] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDebtorForDetails, setSelectedDebtorForDetails] = useState<any>(null)
  const router = useRouter()

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
      icon: ArrowUpRight
    },
    {
      title: 'Payments',
      href: '/dashboard/payments',
      icon: CreditCard
    },
    {
      title: 'Settings',
      href: '/dashboard/settings',
      icon: Settings
    }
  ]

  useEffect(() => {
    init()
  }, [refreshKey])

  const init = async () => {
    const endTimer = PerformanceMonitor.startTimer('debtors-init');
    
    try {
      const { user, error } = await getCurrentUser()

      if (error || !user) {
        router.replace('/login')
        return
      }

      setUser(user)

      try {
        const cacheKey = `debtors-data-${user.id}`;
        const cachedData = DataCache.instance.get(cacheKey);
        
        if (cachedData) {
          setDebtors(cachedData);
        } else {
          const debtorsData = await getApprovedDebtors(user.id)

          if (debtorsData?.data) {
            setDebtors(debtorsData.data);
            DataCache.instance.set(cacheKey, debtorsData.data);
          }
        }

      } catch (err: any) {
        console.error("FETCH ERROR:", err)
        setError("Failed to load debtors")
      }

    } catch (err) {
      console.error("INIT ERROR:", err)
      router.replace('/login')
    } finally {
      setLoading(false)
      endTimer();
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  const handleRequestSent = () => {
    setRefreshKey(prev => prev + 1)
    DataCache.instance.clear();
    init()
  }

  const handleRemindDebtor = (debtor: any) => {
    setSelectedDebtor(debtor)
    setReminderModalOpen(true)
  }

  const handleViewDetails = (debtor: any) => {
    setSelectedDebtorForDetails(debtor)
    setDetailsModalOpen(true)
  }

  const handleSendReminder = async (message: string) => {
    if (!selectedDebtor) return

    setReminderLoading(true)
    
    try {
      // For now, just console.log the message (as requested)
      console.log('Sending reminder to:', selectedDebtor.debtor.email)
      console.log('Message:', message)
      
      // Show success message
      alert(`Reminder sent to ${selectedDebtor.debtor.email}!`)
      
      // In a real implementation, you would:
      // 1. Send email via your email service
      // 2. Log the reminder in your database
      // 3. Update UI to show reminder was sent
      
    } catch (err: any) {
      console.error('Send reminder error:', err)
      throw err
    } finally {
      setReminderLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F6F7' }}>
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-lg" style={{ color: '#2C3E50' }}>Loading debtors...</p>
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
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#2C3E50' }}>Debtors</h1>
                <p className="text-sm text-gray-500 hidden sm:block">
                  Manage all your debtors
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
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Debtors</h1>
                  <p className="text-slate-600 mt-1">Manage people who owe you money</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                    {debtors.length} Active
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-8 space-y-8">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardCard
                title="Total Debtors"
                value={debtors.length.toString()}
                description="Active debtors"
                icon={Users}
                cardStyle="debtor"
                trend={{ value: 'Active accounts', isPositive: true }}
              />
              <DashboardCard
                title="Total Debt"
                value={formatCurrency(debtors.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0))}
                description="Total amount owed"
                icon={PesoSignIcon}
                cardStyle="income"
                trend={{ value: '+8% from last month', isPositive: true }}
              />
              <DashboardCard
                title="Average Debt"
                value={formatCurrency(debtors.length > 0 ? debtors.reduce((sum, debtor) => sum + (parseFloat(debtor.amount) || 0), 0) / debtors.length : 0)}
                description="Per debtor average"
                icon={TrendingUp}
                cardStyle="debtor"
                trend={{ value: 'Stable', isPositive: true }}
              />
              <DashboardCard
                title="Active Accounts"
                value={debtors.filter(d => d.status === 'active').length.toString()}
                description="Currently active"
                icon={CreditCard}
                cardStyle="debtor"
                trend={{ value: 'All active', isPositive: true }}
              />
            </div>

            {/* Debtors Table - Premium Styled */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 border-b border-indigo-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg shadow-indigo-500/25">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-indigo-900">All Debtors</CardTitle>
                      <p className="text-indigo-700 text-sm mt-1">Complete list of people who owe you money</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-indigo-100 text-indigo-700 border-indigo-200">
                    {debtors.length} Total
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {debtors.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 mb-6">
                      <Users className="h-10 w-10 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">No debtors yet</h3>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                      Send requests to people who owe you money to start tracking your debts.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-indigo-600">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                      <span>Waiting for debt requests to be accepted</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {/* Mobile Card View */}
                    <div className="block md:hidden divide-y divide-slate-100">
                      {debtors.map((debtor) => (
                        <div key={debtor.id} className="p-4 hover:bg-indigo-50/30 transition-colors">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center shadow-sm">
                                <span className="text-indigo-700 font-bold text-lg">
                                  {debtor.debtor.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-900 text-lg">{debtor.debtor.email}</h3>
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 mt-1">
                                  Active
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Amount Owed</p>
                              <span className="text-2xl font-bold text-indigo-600">
                                {formatCurrency(debtor.amount || 0)}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleRemindDebtor(debtor)}
                                variant="outline"
                                size="sm"
                                className="border-orange-200 text-orange-600 hover:bg-orange-50"
                                disabled={reminderLoading}
                              >
                                <Bell className="h-4 w-4 mr-2" />
                                Remind
                              </Button>
                              <Button 
                                onClick={() => handleViewDetails(debtor)}
                                className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:from-indigo-600 hover:to-blue-700 shadow-lg"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold text-slate-700">Debtor</TableHead>
                            <TableHead className="font-semibold text-slate-700">Amount</TableHead>
                            <TableHead className="font-semibold text-slate-700">Status</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {debtors.map((debtor) => (
                            <TableRow key={debtor.id} className="hover:bg-indigo-50/30 transition-colors">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                                    <span className="text-indigo-600 font-semibold text-sm">
                                      {debtor.debtor.email.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-slate-900">{debtor.debtor.email}</span>
                                    <div className="text-xs text-slate-500">ID: {debtor.id.slice(0, 8)}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <span className="font-bold text-indigo-600 text-lg">
                                    {formatCurrency(debtor.amount || 0)}
                                  </span>
                                  <div className="text-xs text-slate-500">Outstanding</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                  Active
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button 
                                    onClick={() => handleRemindDebtor(debtor)}
                                    variant="outline"
                                    size="sm"
                                    className="border-orange-200 text-orange-600 hover:bg-orange-50"
                                    disabled={reminderLoading}
                                  >
                                    <Bell className="h-4 w-4 mr-2" />
                                    Remind
                                  </Button>
                                  <Button 
                                    onClick={() => handleViewDetails(debtor)}
                                    className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:from-indigo-600 hover:to-blue-700 shadow-lg"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Reminder Modal */}
          {selectedDebtor && (
            <ReminderModal
              isOpen={reminderModalOpen}
              onClose={() => setReminderModalOpen(false)}
              debtor={selectedDebtor}
              onSendReminder={handleSendReminder}
              loading={reminderLoading}
            />
          )}
          
          {/* Details Modal */}
          {selectedDebtorForDetails && (
            <DetailsModal
              isOpen={detailsModalOpen}
              onClose={() => setDetailsModalOpen(false)}
              person={selectedDebtorForDetails}
              type="debtor"
            />
          )}
        </main>
      </div>
    </div>
  )
}
