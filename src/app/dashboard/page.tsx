'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut, getCurrentUser } from '@/lib/auth'
import { getDebtors, getDashboardStats } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, LogOut, Users, DollarSign, TrendingUp } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AddDebtorDialog } from '@/components/AddDebtorDialog'

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
  const router = useRouter()

  useEffect(() => {
    init()
  }, [])

  // ✅ SAFE INIT (NO FREEZE)
  const init = async () => {
    try {
      const { user, error } = await getCurrentUser()

      console.log("DASHBOARD USER:", user)

      if (error || !user) {
        router.replace('/login')
        return
      }

      setUser(user)

      // ✅ TRY FETCH BUT DON'T BLOCK UI
      try {
        const [debtorsData, statsData] = await Promise.all([
          getDebtors(user.id),
          getDashboardStats(user.id)
        ])

        console.log("DEBTORS:", debtorsData)
        console.log("STATS:", statsData)

        if (debtorsData?.data) setDebtors(debtorsData.data)
        if (statsData?.data) setStats(statsData.data)

      } catch (err: any) {
        console.error("FETCH ERROR:", err)
        setError("Failed to load data (but login works)")
      }

    } catch (err) {
      console.error("INIT ERROR:", err)
      router.replace('/login')
    } finally {
      setLoading(false) // ✅ ALWAYS STOPS LOADING
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.replace('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between">
          <h1 className="text-xl font-bold">Debt Tracker</h1>
          <div className="flex items-center gap-4">
            <span>{user?.email}</span>
            <Button onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent>
              <p>Total Debt</p>
              <h2>${stats.totalDebt}</h2>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p>Remaining</p>
              <h2>${stats.totalRemaining}</h2>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p>Paid</p>
              <h2>${stats.totalPaid}</h2>
            </CardContent>
          </Card>
        </div>

        {/* TABLE */}
        <Card>
          <CardHeader>
            <CardTitle>Debtors</CardTitle>
          </CardHeader>
          <CardContent>
            {debtors.length === 0 ? (
              <p>No debtors yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Debt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debtors.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.name}</TableCell>
                      <TableCell>${d.total_debt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}