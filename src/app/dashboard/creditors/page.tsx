'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut, getCurrentUser } from '@/lib/auth'
import { getApprovedCreditors } from '@/lib/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { DashboardCard } from '@/components/ui/DashboardCard'
import { Sidebar } from '@/components/ui/Sidebar'
import { MobileSidebar } from '@/components/ui/MobileSidebar'
import { DebtRequestDialog } from '@/components/DebtRequestDialog'
import { PaymentModal } from '@/components/PaymentModal'
import { formatCurrency } from '@/lib/currency'
import { DataCache, PerformanceMonitor } from '@/lib/performance'
import { 
  createPaymentRequest,
  checkPendingPaymentRequest,
  getPaymentRequests,
  PaymentRequest
} from '@/lib/database'
import { 
  LogOut, 
  Users, 
  TrendingUp, 
  Home,
  CreditCard,
  Settings,
  User,
  Eye,
  ArrowUpRight
} from 'lucide-react'
import { PesoSignIcon } from '@/components/ui/PesoSignIcon'
import { DetailsModal } from '@/components/DetailsModal'

export default function CreditorsPage() {
  const [user, setUser] = useState<any>(null)
  const [creditors, setCreditors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedCreditor, setSelectedCreditor] = useState<any>(null)
  const [pendingRequests, setPendingRequests] = useState<PaymentRequest[]>([])
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedCreditorForDetails, setSelectedCreditorForDetails] = useState<any>(null)
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
    const endTimer = PerformanceMonitor.startTimer('creditors-init');
    
    try {
      const { user, error } = await getCurrentUser()

      if (error || !user) {
        router.replace('/login')
        return
      }

      setUser(user)

      try {
        // Clear old cache to ensure fresh data with new filtering
        const cacheKey = `creditors-data-${user.id}`;
        DataCache.instance.clear();
        
        const creditorsData = await getApprovedCreditors(user.id)

        if (creditorsData?.data) {
          // Filter out creditors with zero or negative balance
          const filteredCreditors = creditorsData.data.filter((creditor: any) => {
            // Get remaining amount - check both fields
            const remaining = parseFloat(creditor.remaining_amount) || 0
            const original = parseFloat(creditor.amount) || 0
            // Use remaining_amount if available, otherwise fall back to amount
            const balance = remaining > 0 ? remaining : original
            console.log('Creditor:', creditor.creditor?.email, 'Balance:', balance)
            return balance > 0
          })
          console.log('Filtered creditors:', filteredCreditors.length, 'of', creditorsData.data.length)
          setCreditors(filteredCreditors);
          DataCache.instance.set(cacheKey, filteredCreditors);
        }

        // Fetch pending payment requests
        try {
          const { data: pendingData } = await getPaymentRequests(user.id)
          if (pendingData) {
            const pending = pendingData.filter(pr => pr.status === 'pending')
            setPendingRequests(pending)
          }
        } catch (err) {
          console.error('Failed to fetch pending requests:', err)
        }

      } catch (err: any) {
        console.error("FETCH ERROR:", err)
        setError("Failed to load creditors")
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

  const handlePayCredit = (creditor: any) => {
    setSelectedCreditor(creditor)
    setPaymentModalOpen(true)
  }

  const handleViewDetails = (creditor: any) => {
    setSelectedCreditorForDetails(creditor)
    setDetailsModalOpen(true)
  }

  const handlePaymentSubmit = async (amount: number) => {
    if (!selectedCreditor || !user) return

    setPaymentLoading(true)
    
    try {
      // Check for existing pending request
      const { data: existingRequest } = await checkPendingPaymentRequest(
        user.id,
        selectedCreditor.creditor_id
      )

      if (existingRequest) {
        throw new Error('You already have a pending payment request to this creditor')
      }

      // Create payment request
      const { data, error } = await createPaymentRequest(
        user.id,
        selectedCreditor.creditor_id,
        amount
      )

      if (error) {
        throw error
      }

      // Show success message (you could use a toast here)
      alert('Payment request sent successfully!')
      
      // Refresh data
      handleRequestSent()
      
    } catch (err: any) {
      console.error('Payment request error:', err)
      throw err
    } finally {
      setPaymentLoading(false)
    }
  }

  const hasPendingRequest = (creditorId: string) => {
    return pendingRequests.some(pr => pr.creditor_id === creditorId && pr.status === 'pending')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F6F7' }}>
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-lg" style={{ color: '#2C3E50' }}>Loading creditors...</p>
        </div>
      </div>
    )
  }

  const totalOwed = creditors.reduce((sum, creditor) => sum + (parseFloat(creditor.amount) || 0), 0)

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
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#2C3E50' }}>Creditors</h1>
                <p className="text-sm text-gray-500 hidden sm:block">
                  Manage people you owe money to
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
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Creditors</h1>
                  <p className="text-slate-600 mt-1">Manage people you owe money to</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                    {creditors.length} Active
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
                title="Total Creditors"
                value={creditors.length.toString()}
                description="Active creditors"
                icon={ArrowUpRight}
                cardStyle="creditor"
                trend={{ value: 'Active accounts', isPositive: true }}
              />
              <DashboardCard
                title="Total Owed"
                value={formatCurrency(totalOwed)}
                description="Total amount you owe"
                icon={PesoSignIcon}
                cardStyle="expense"
                trend={{ value: '-3% from last month', isPositive: true }}
              />
              <DashboardCard
                title="Average Debt"
                value={formatCurrency(creditors.length > 0 ? totalOwed / creditors.length : 0)}
                description="Per creditor average"
                icon={TrendingUp}
                cardStyle="creditor"
                trend={{ value: 'Stable', isPositive: true }}
              />
              <DashboardCard
                title="Active Accounts"
                value={creditors.filter(c => c.status === 'active').length.toString()}
                description="Currently active"
                icon={CreditCard}
                cardStyle="creditor"
                trend={{ value: 'All active', isPositive: true }}
              />
            </div>

            {/* Creditors Table - Premium Styled */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border-b border-emerald-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/25">
                      <ArrowUpRight className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-emerald-900">All Creditors</CardTitle>
                      <p className="text-emerald-700 text-sm mt-1">Complete list of people you owe money to</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      {creditors.length} Total
                    </Badge>
                    <DebtRequestDialog 
                      currentUserId={user.id}
                      type="creditor"
                      onRequestSent={handleRequestSent}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {creditors.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 mb-6">
                      <ArrowUpRight className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">No creditors yet</h3>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                      You haven't added any creditors. Send requests to people you owe money to.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-emerald-600">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span>Click the + button to add your first creditor</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {/* Mobile Card View */}
                    <div className="block md:hidden divide-y divide-slate-100">
                      {creditors.map((creditor) => (
                        <div key={creditor.id} className="p-4 hover:bg-emerald-50/30 transition-colors">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-sm">
                                <span className="text-emerald-700 font-bold text-lg">
                                  {creditor.creditor.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-900 text-lg">{creditor.creditor.email}</h3>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 mt-1">
                                  Owed
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Amount Owed</p>
                              <span className="text-2xl font-bold text-emerald-600">
                                {formatCurrency(creditor.amount || 0)}
                              </span>
                              {creditor.deadline && (
                                <div className="mt-2">
                                  <p className="text-xs text-slate-500 mb-1">Deadline</p>
                                  <p className={`text-sm font-medium ${
                                    new Date(creditor.deadline) < new Date() 
                                      ? 'text-red-600' 
                                      : 'text-slate-700'
                                  }`}>
                                    {new Date(creditor.deadline).toLocaleDateString()}
                                    {new Date(creditor.deadline) < new Date() && (
                                      <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                        Overdue
                                      </span>
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {hasPendingRequest(creditor.creditor_id) ? (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  Pending Request
                                </Badge>
                              ) : (
                                <Button 
                                  onClick={() => handlePayCredit(creditor)}
                                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                                  disabled={paymentLoading}
                                >
                                  <PesoSignIcon className="h-4 w-4 mr-2" />
                                  Pay Credit
                                </Button>
                              )}
                              <Button 
                                onClick={() => handleViewDetails(creditor)}
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg"
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
                            <TableHead className="font-semibold text-slate-700">Creditor</TableHead>
                            <TableHead className="font-semibold text-slate-700">Amount</TableHead>
                            <TableHead className="font-semibold text-slate-700">Deadline</TableHead>
                            <TableHead className="font-semibold text-slate-700">Status</TableHead>
                            <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {creditors.map((creditor) => (
                            <TableRow key={creditor.id} className="hover:bg-emerald-50/30 transition-colors">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                                    <span className="text-emerald-600 font-semibold text-sm">
                                      {creditor.creditor.email.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-slate-900">{creditor.creditor.email}</span>
                                    <div className="text-xs text-slate-500">ID: {creditor.id.slice(0, 8)}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <span className="font-bold text-emerald-600 text-lg">
                                    {formatCurrency(creditor.amount || 0)}
                                  </span>
                                  <div className="text-xs text-slate-500">Outstanding</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {creditor.deadline ? (
                                  <div>
                                    <p className={`text-sm font-medium ${
                                      new Date(creditor.deadline) < new Date() 
                                        ? 'text-red-600' 
                                        : 'text-slate-700'
                                    }`}>
                                      {new Date(creditor.deadline).toLocaleDateString()}
                                    </p>
                                    {new Date(creditor.deadline) < new Date() && (
                                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 mt-1">
                                        Overdue
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-sm text-slate-500">No deadline</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                  Owed
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {hasPendingRequest(creditor.creditor_id) ? (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                      Pending Request
                                    </Badge>
                                  ) : (
                                    <Button 
                                      onClick={() => handlePayCredit(creditor)}
                                      className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 shadow-lg"
                                      disabled={paymentLoading}
                                    >
                                      <PesoSignIcon className="h-4 w-4 mr-2" />
                                      Pay Credit
                                    </Button>
                                  )}
                                  <Button 
                                    onClick={() => handleViewDetails(creditor)}
                                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg"
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
        </main>
      </div>
      
      {/* Payment Modal */}
      {selectedCreditor && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSubmit={handlePaymentSubmit}
          creditorEmail={selectedCreditor.creditor.email}
          maxAmount={parseFloat(selectedCreditor.amount) || 0}
          loading={paymentLoading}
        />
      )}
      
      {/* Details Modal */}
      {selectedCreditorForDetails && (
        <DetailsModal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          person={selectedCreditorForDetails}
          type="creditor"
        />
      )}
    </div>
  )
}
