'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut, getCurrentUser } from '@/lib/auth'
import { getApprovedCreditors } from '@/lib/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { DashboardCard } from '@/components/ui/DashboardCard'
import { Sidebar } from '@/components/ui/Sidebar'
import { MobileSidebar } from '@/components/ui/MobileSidebar'
import { DebtRequestDialog } from '@/components/DebtRequestDialog'
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
  ArrowUpRight,
  Eye
} from 'lucide-react'

export default function CreditorsPage() {
  const [user, setUser] = useState<any>(null)
  const [creditors, setCreditors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
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
        const cacheKey = `creditors-data-${user.id}`;
        const cachedData = DataCache.instance.get(cacheKey);
        
        if (cachedData) {
          setCreditors(cachedData);
        } else {
          const creditorsData = await getApprovedCreditors(user.id)

          if (creditorsData?.data) {
            setCreditors(creditorsData.data);
            DataCache.instance.set(cacheKey, creditorsData.data);
          }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading creditors...</p>
        </div>
      </div>
    )
  }

  const totalOwed = creditors.reduce((sum, creditor) => sum + (parseFloat(creditor.amount) || 0), 0)

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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Creditors</h1>
                <p className="text-sm text-gray-500 hidden sm:block">
                  Manage people you owe money to
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <DashboardCard
              title="Total Creditors"
              value={creditors.length.toString()}
              description="Active creditors"
              icon={ArrowUpRight}
            />
            <DashboardCard
              title="Total Owed"
              value={formatCurrency(totalOwed)}
              description="Total amount you owe"
              icon={DollarSign}
            />
            <DashboardCard
              title="Average Debt"
              value={formatCurrency(creditors.length > 0 ? totalOwed / creditors.length : 0)}
              description="Per creditor average"
              icon={TrendingUp}
            />
            <DashboardCard
              title="Active Accounts"
              value={creditors.filter(c => c.status === 'active').length.toString()}
              description="Currently active"
              icon={CreditCard}
            />
          </div>

          {/* Creditors Table */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-lg font-semibold">All Creditors</CardTitle>
                <DebtRequestDialog 
                  currentUserId={user.id}
                  type="creditor"
                  onRequestSent={handleRequestSent}
                />
              </div>
            </CardHeader>
            <CardContent>
              {creditors.length === 0 ? (
                <EmptyState
                  icon={ArrowUpRight}
                  title="No creditors yet"
                  description="You haven't added any creditors. Send requests to people you owe money to."
                  action={{
                    label: 'Add First Creditor',
                    onClick: () => {}
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {/* Mobile Card View */}
                  <div className="block md:hidden space-y-3">
                    {creditors.map((creditor) => (
                      <Card key={creditor.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">{creditor.creditor.email}</h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Owed
                          </span>
                        </div>
                        <p className="text-lg font-bold text-red-600 mb-2">
                          {formatCurrency(creditor.amount || 0)}
                        </p>
                        <div className="flex gap-2">
                          <Link href={`/dashboard/creditors/${creditor.id}`}>
                            <Button variant="outline" size="sm" className="flex-1">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-semibold">Email</TableHead>
                          <TableHead className="font-semibold">Amount Owed</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {creditors.map((creditor) => (
                          <TableRow key={creditor.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">{creditor.creditor.email}</TableCell>
                            <TableCell>
                              <span className="font-semibold text-red-600">
                                {formatCurrency(creditor.amount || 0)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Owed
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Link href={`/dashboard/creditors/${creditor.id}`}>
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
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
