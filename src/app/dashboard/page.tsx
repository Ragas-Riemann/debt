'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut, getCurrentUser } from '@/lib/auth'
import { getDashboardStats } from '@/lib/actions'
import { getApprovedDebtors, getApprovedCreditors, getPendingRequests } from '@/lib/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { DashboardCard } from '@/components/ui/DashboardCard'
import { Sidebar } from '@/components/ui/Sidebar'
import { DebtRequestDialog } from '@/components/DebtRequestDialog'
import { PendingRequests } from '@/components/PendingRequests'
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
  ArrowUpRight,
  Clock
} from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [debtors, setDebtors] = useState<any[]>([])
  const [creditors, setCreditors] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
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
          setCreditors(cachedData.creditors);
          setStats(cachedData.stats);
          setPendingRequests(cachedData.pendingRequests || []);
        } else {
          const [debtorsData, creditorsData, statsData, pendingData] = await Promise.all([
            getApprovedDebtors(user.id),
            getApprovedCreditors(user.id),
            getDashboardStats(user.id),
            getPendingRequests(user.id)
          ])

          const debtors = debtorsData?.data || [];
          const creditors = creditorsData?.data || [];
          const stats = statsData?.data || { totalDebt: 0, totalRemaining: 0, totalPaid: 0 };
          const pending = pendingData?.data || [];

          if (debtorsData?.data) setDebtors(debtors)
          if (creditorsData?.data) setCreditors(creditors)
          if (statsData?.data) setStats(stats)
          if (pendingData?.data) setPendingRequests(pending)

          // Cache the results
          DataCache.instance.set(cacheKey, { debtors, creditors, stats, pendingRequests: pending });
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4F6F7' }}>
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-lg" style={{ color: '#2C3E50' }}>Loading dashboard...</p>
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
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: '#2C3E50' }}>Dashboard</h1>
                <p className="text-sm text-gray-500 hidden sm:block">
                  Welcome back, {user?.email?.split('@')[0]}
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

        {/* Main Content */}
        <main className="flex-1 bg-gradient-to-br from-slate-50 via-white to-gray-50 min-h-screen">
          <div className="px-6 py-8 space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardCard
              title="Total Debtors"
              value={debtors.length.toString()}
              description="People who owe you"
              icon={Users}
              cardStyle="debtor"
              trend={{ value: 'Active accounts', isPositive: true }}
            />
            <DashboardCard
              title="Total Creditors"
              value={creditors.length.toString()}
              description="People you owe"
              icon={ArrowUpRight}
              cardStyle="creditor"
              trend={{ value: 'Active accounts', isPositive: true }}
            />
            <DashboardCard
              title="Total Owed to You"
              value={formatCurrency(stats.totalDebt)}
              description="Incoming payments"
              icon={DollarSign}
              cardStyle="income"
              trend={{ value: '+12% from last month', isPositive: true }}
            />
            <DashboardCard
              title="Total You Owe"
              value={formatCurrency(stats.totalRemaining)}
              description="Outgoing payments"
              icon={CreditCard}
              cardStyle="expense"
              trend={{ value: '-5% from last month', isPositive: false }}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="group relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-600">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="relative z-10 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-white">Debtors</CardTitle>
                      <p className="text-indigo-100 text-sm mt-1">Manage people who owe you money</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-white">{debtors.length}</p>
                    <p className="text-indigo-100 text-sm">Active debtors</p>
                  </div>
                  <Link href="/dashboard/debtors">
                    <Button className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 transition-all">
                      <Eye className="h-4 w-4 mr-2" />
                      View All
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-green-600">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="relative z-10 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                      <ArrowUpRight className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-white">Creditors</CardTitle>
                      <p className="text-emerald-100 text-sm mt-1">Manage people you owe money to</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-3xl font-bold text-white">{creditors.length}</p>
                    <p className="text-emerald-100 text-sm">Active creditors</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/dashboard/creditors">
                      <Button className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30 transition-all">
                        <Eye className="h-4 w-4 mr-2" />
                        View All
                      </Button>
                    </Link>
                    <DebtRequestDialog 
                      currentUserId={user.id}
                      type="creditor"
                      onRequestSent={handleDebtorAdded}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Requests */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50">
            <CardHeader className="border-b border-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-purple-900">Pending Requests</CardTitle>
                    <p className="text-purple-700 text-sm">Review and manage debt requests</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                  {pendingRequests.length} pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <PendingRequests 
                currentUserId={user.id}
                onRequestUpdated={handleDebtorAdded}
              />
            </CardContent>
          </Card>
          </div>
        </main>
      </div>
    </div>
  )
}