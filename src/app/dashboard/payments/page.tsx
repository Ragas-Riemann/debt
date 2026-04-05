'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, getCurrentUser } from '@/lib/auth'
import { 
  getPaymentRequests,
  createPaymentRequest,
  checkPendingPaymentRequest,
  acceptPaymentRequest,
  rejectPaymentRequest,
  PaymentRequest
} from '@/lib/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DashboardCard } from '@/components/ui/DashboardCard'
import { Sidebar } from '@/components/ui/Sidebar'
import { MobileSidebar } from '@/components/ui/MobileSidebar'
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
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { PesoSignIcon } from '@/components/ui/PesoSignIcon'

export default function PaymentsPage() {
  const [user, setUser] = useState<any>(null)
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
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
    const endTimer = PerformanceMonitor.startTimer('payments-init');
    
    try {
      const { user, error } = await getCurrentUser()

      if (error || !user) {
        router.replace('/login')
        return
      }

      setUser(user)

      try {
        const cacheKey = `payment-requests-${user.id}`;
        const cachedData = DataCache.instance.get(cacheKey);
        
        if (cachedData) {
          setPaymentRequests(cachedData);
        } else {
          const requestsData = await getPaymentRequests(user.id)

          if (requestsData?.data) {
            setPaymentRequests(requestsData.data);
            DataCache.instance.set(cacheKey, requestsData.data);
          }
        }

      } catch (err: any) {
        console.error("FETCH ERROR:", err)
        setError("Failed to load payment requests")
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

  const handleAcceptPayment = async (requestId: string) => {
    setActionLoading(requestId)
    try {
      const { error } = await acceptPaymentRequest(requestId)
      if (error) {
        throw error
      }
      
      // Show success message
      alert('Payment accepted successfully!')
      
      // Refresh data
      setRefreshKey(prev => prev + 1)
      DataCache.instance.clear()
      init()
      
    } catch (err: any) {
      console.error('Accept payment error:', err)
      alert('Failed to accept payment: ' + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectPayment = async (requestId: string) => {
    setActionLoading(requestId)
    try {
      const { error } = await rejectPaymentRequest(requestId)
      if (error) {
        throw error
      }
      
      // Show success message
      alert('Payment rejected successfully!')
      
      // Refresh data
      setRefreshKey(prev => prev + 1)
      DataCache.instance.clear()
      init()
      
    } catch (err: any) {
      console.error('Reject payment error:', err)
      alert('Failed to reject payment: ' + err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'accepted':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTransactionMessage = (request: PaymentRequest) => {
    const isDebtor = request.debtor_id === user?.id
    
    if (isDebtor) {
      return {
        message: `You paid ${formatCurrency(request.amount)} to ${request.creditor_email}`,
        icon: ArrowUpRight,
        iconColor: 'text-green-600',
        bgColor: 'bg-green-50'
      }
    } else {
      return {
        message: `${request.debtor_email} paid you ${formatCurrency(request.amount)}`,
        icon: ArrowDownLeft,
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-50'
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F6F7' }}>
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-lg" style={{ color: '#2C3E50' }}>Loading payment history...</p>
        </div>
      </div>
    )
  }

  const totalPaid = paymentRequests
    .filter(pr => pr.status === 'accepted' && pr.debtor_id === user?.id)
    .reduce((sum, pr) => sum + pr.amount, 0)

  const totalReceived = paymentRequests
    .filter(pr => pr.status === 'accepted' && pr.creditor_id === user?.id)
    .reduce((sum, pr) => sum + pr.amount, 0)

  const pendingRequests = paymentRequests.filter(pr => pr.status === 'pending').length

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
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#2C3E50' }}>Payments</h1>
                <p className="text-sm text-gray-500 hidden sm:block">
                  Transaction history and payment requests
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
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Payment History</h1>
                  <p className="text-slate-600 mt-1">Track all your payment transactions</p>
                </div>
                <div className="flex items-center gap-3">
                  {pendingRequests > 0 && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      {pendingRequests} Pending
                    </Badge>
                  )}
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
                title="Total Paid"
                value={formatCurrency(totalPaid)}
                description="Amount you've paid"
                icon={ArrowUpRight}
                cardStyle="expense"
                trend={{ value: 'Outgoing payments', isPositive: false }}
              />
              <DashboardCard
                title="Total Received"
                value={formatCurrency(totalReceived)}
                description="Amount you've received"
                icon={ArrowDownLeft}
                cardStyle="income"
                trend={{ value: 'Incoming payments', isPositive: true }}
              />
              <DashboardCard
                title="Net Balance"
                value={formatCurrency(totalReceived - totalPaid)}
                description="Received minus paid"
                icon={PesoSignIcon}
                cardStyle={totalReceived >= totalPaid ? "income" : "expense"}
                trend={{ value: totalReceived >= totalPaid ? 'Positive' : 'Negative', isPositive: totalReceived >= totalPaid }}
              />
              <DashboardCard
                title="Total Transactions"
                value={paymentRequests.length.toString()}
                description="All payment requests"
                icon={CreditCard}
                cardStyle="creditor"
                trend={{ value: `${paymentRequests.filter(pr => pr.status === 'accepted').length} completed`, isPositive: true }}
              />
            </div>

            {/* Payment Requests List */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-blue-900">Transaction History</CardTitle>
                      <p className="text-blue-700 text-sm mt-1">Complete payment transaction logs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                      {paymentRequests.length} Total
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {paymentRequests.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 mb-6">
                      <CreditCard className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">No transactions yet</h3>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
                      Your payment history will appear here once you start making or receiving payments.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>Go to Creditors page to make a payment</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {/* Mobile Card View */}
                    <div className="block md:hidden divide-y divide-slate-100">
                      {paymentRequests.map((request) => {
                        const transaction = getTransactionMessage(request)
                        return (
                          <div key={request.id} className="p-4 hover:bg-blue-50/30 transition-colors">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full ${transaction.bgColor} flex items-center justify-center shadow-sm`}>
                                  <transaction.icon className={`h-6 w-6 ${transaction.iconColor}`} />
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900 text-sm mb-1">
                                    {transaction.message}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {formatDate(request.created_at)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {getStatusBadge(request.status)}
                                {request.status === 'pending' && request.creditor_id === user?.id && (
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      onClick={() => handleAcceptPayment(request.id)}
                                      disabled={actionLoading === request.id}
                                      className="bg-green-500 hover:bg-green-600 text-white"
                                    >
                                      {actionLoading === request.id ? '...' : 'Accept'}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRejectPayment(request.id)}
                                      disabled={actionLoading === request.id}
                                      className="border-red-200 text-red-600 hover:bg-red-50"
                                    >
                                      {actionLoading === request.id ? '...' : 'Reject'}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="font-semibold text-slate-700">Transaction</TableHead>
                            <TableHead className="font-semibold text-slate-700">Amount</TableHead>
                            <TableHead className="font-semibold text-slate-700">Status</TableHead>
                            <TableHead className="font-semibold text-slate-700">Date</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paymentRequests.map((request) => {
                            const transaction = getTransactionMessage(request)
                            return (
                              <TableRow key={request.id} className="hover:bg-blue-50/30 transition-colors">
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full ${transaction.bgColor} flex items-center justify-center`}>
                                      <transaction.icon className={`h-5 w-5 ${transaction.iconColor}`} />
                                    </div>
                                    <div>
                                      <span className="font-medium text-slate-900">
                                        {transaction.message}
                                      </span>
                                      <div className="text-xs text-slate-500">
                                        ID: {request.id.slice(0, 8)}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <span className="font-bold text-slate-900 text-lg">
                                      {formatCurrency(request.amount)}
                                    </span>
                                    <div className="text-xs text-slate-500">
                                      {request.debtor_id === user?.id ? 'Outgoing' : 'Incoming'}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {getStatusBadge(request.status)}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <span className="font-medium text-slate-900">
                                      {formatDate(request.created_at)}
                                    </span>
                                    <div className="text-xs text-slate-500">
                                      {request.status === 'pending' ? 'Awaiting response' : 'Completed'}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  {request.status === 'pending' && request.creditor_id === user?.id ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleAcceptPayment(request.id)}
                                        disabled={actionLoading === request.id}
                                        className="bg-green-500 hover:bg-green-600 text-white"
                                      >
                                        {actionLoading === request.id ? '...' : 'Accept'}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRejectPayment(request.id)}
                                        disabled={actionLoading === request.id}
                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                      >
                                        {actionLoading === request.id ? '...' : 'Reject'}
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-slate-500">
                                      {request.status === 'pending' ? 'Awaiting action' : 'Completed'}
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
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
    </div>
  )
}
