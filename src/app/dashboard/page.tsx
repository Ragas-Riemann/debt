'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut, getCurrentUser } from '@/lib/auth'
import { getDashboardStats } from '@/lib/actions'
import { getApprovedDebtors } from '@/lib/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { DashboardCard } from '@/components/ui/DashboardCard'
import { Sidebar } from '@/components/ui/Sidebar'
import { DebtRequestDialog } from '@/components/DebtRequestDialog'
import { PendingRequests } from '@/components/PendingRequests'
import { DebugUsers } from '@/components/debug/DebugUsers'
import { MobileSidebar } from '@/components/ui/MobileSidebar'
import { formatCurrency } from '@/lib/currency'
import { DataCache, PerformanceMonitor } from '@/lib/performance'
import { 
  LogOut, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Home,
  CreditCard,
  Settings,
  User,
  Eye,
  ArrowUpRight
} from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [debtors, setDebtors] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalDebt: 0,
    totalRemaining: 0,
    totalPaid: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    init()
  }, [refreshKey])

  // ✅ SAFE INIT (NO FREEZE) - Optimized with caching
  const init = async () => {
    const endTimer = PerformanceMonitor.startTimer('dashboard-init');
    
    try {
      const { user, error } = await getCurrentUser()

      console.log("DASHBOARD USER:", user)

      if (error || !user) {
        router.replace('/login')
        return
      }

      setUser(user)

      // ✅ OPTIMIZED FETCH WITH CACHING
      try {
        const cacheKey = `dashboard-data-${user.id}`;
        const cachedData = DataCache.instance.get(cacheKey);
        
        if (cachedData) {
          setDebtors(cachedData.debtors);
          setStats(cachedData.stats);
        } else {
          const [debtorsData, statsData] = await Promise.all([
            getApprovedDebtors(user.id),
            getDashboardStats(user.id)
          ])

          console.log("DEBTORS:", debtorsData)
          console.log("STATS:", statsData)

          const debtors = debtorsData?.data || [];
          const stats = statsData?.data || { totalDebt: 0, totalRemaining: 0, totalPaid: 0 };

          if (debtorsData?.data) setDebtors(debtors)
          if (statsData?.data) setStats(stats)

          // Cache the results
          DataCache.instance.set(cacheKey, { debtors, stats });
        }

      } catch (err: any) {
        console.error("FETCH ERROR:", err)
        setError("Failed to load data (but login works)")
      }

    } catch (err) {
      console.error("INIT ERROR:", err)
      router.replace('/login')
    } finally {
      setLoading(false) // ✅ ALWAYS STOPS LOADING
      endTimer();
    }
  }

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

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  const handleDebtorAdded = () => {
    setRefreshKey(prev => prev + 1)
    setShowAddDialog(false)
    // Clear cache to force refresh
    DataCache.instance.clear();
    init()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500 hidden sm:block">
                  Welcome back, {user?.email?.split('@')[0]}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <User className="h-4 w-4 mr-2" />
                {user?.email}
              </Button>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Debug Component */}
          <DebugUsers />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <DashboardCard
              title="Total Debt"
              value={formatCurrency(debtors.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0))}
              description="Total amount owed to you"
              icon={DollarSign}
            />
            <DashboardCard
              title="Remaining Balance"
              value={formatCurrency(stats.totalRemaining)}
              description="Outstanding amount"
              icon={CreditCard}
            />
            <DashboardCard
              title="Total Paid"
              value={formatCurrency(stats.totalPaid)}
              description="Amount collected"
              icon={TrendingUp}
            />
          </div>

          {/* Debtors Section */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-lg font-semibold">Recent Debtors</CardTitle>
                <DebtRequestDialog 
                  currentUserId={user.id}
                  type="debtor"
                  onRequestSent={handleDebtorAdded}
                />
              </div>
            </CardHeader>
            <CardContent>
              {debtors.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No debtors yet"
                  description="Start by adding your first debtor to track their debts and payments."
                  action={{
                    label: 'Add First Debtor',
                    onClick: () => setShowAddDialog(true)
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {/* Mobile Card View */}
                  <div className="block md:hidden space-y-3">
                    {debtors.map((debtor) => (
                      <Card key={debtor.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">{debtor.debtor.email}</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Active
                          </span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 mb-2">
                          {formatCurrency(debtor.amount || 0)}
                        </p>
                        <Link href={`/dashboard/debtors/${debtor.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold">Email</TableHead>
                          <TableHead className="font-semibold">Total Debt</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {debtors.map((debtor) => (
                          <TableRow key={debtor.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{debtor.debtor.email}</TableCell>
                            <TableCell>
                              <span className="font-semibold text-gray-900">
                                {formatCurrency(debtor.amount || 0)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Active
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Link href={`/dashboard/debtors/${debtor.id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {debtors.length > 0 && (
                    <div className="text-center pt-4">
                      <Link href="/dashboard/debtors">
                        <Button variant="outline">
                          View All Debtors
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Requests Section */}
          <PendingRequests 
            currentUserId={user.id}
            onRequestUpdated={handleDebtorAdded}
          />
        </main>
      </div>
    </div>
  )
}