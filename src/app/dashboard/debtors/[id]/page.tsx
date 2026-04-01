'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getDebtor, getDebts, getPayments, createDebt, createPayment, deleteDebt, deletePayment } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatCurrency } from '@/lib/currency'
import { ArrowLeft, Plus, Trash2, DollarSign } from 'lucide-react'

interface Debtor {
  id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  total_debt: number
  remaining_balance: number
  total_paid: number
  created_at: string
}

interface Debt {
  id: string
  debtor_id: string
  amount: number
  description: string | null
  created_at: string
}

interface Payment {
  id: string
  debt_id: string
  amount_paid: number
  created_at: string
}

export default function DebtorDetailPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<any>(null)
  const [debtor, setDebtor] = useState<Debtor | null>(null)
  const [debts, setDebts] = useState<Debt[]>([])
  const [payments, setPayments] = useState<{ [key: string]: Payment[] }>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [debtDialogOpen, setDebtDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { user, error } = await getCurrentUser()
    if (error || !user) {
      router.push('/login')
      return
    }
    setUser(user)
    fetchData(params.id)
  }

  const fetchData = async (debtorId: string) => {
    try {
      const [debtorData, debtsData] = await Promise.all([
        getDebtor(debtorId),
        getDebts(debtorId)
      ])

      if (debtorData.error) throw debtorData.error
      if (debtsData.error) throw debtsData.error

      setDebtor(debtorData.data)
      setDebts(debtsData.data || [])

      // Fetch payments for each debt
      const paymentsData: { [key: string]: Payment[] } = {}
      for (const debt of debtsData.data || []) {
        const { data, error } = await getPayments(debt.id)
        if (!error && data) {
          paymentsData[debt.id] = data
        }
      }
      setPayments(paymentsData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    
    const { error } = await createDebt({
      debtor_id: params.id,
      amount: Number(formData.get('amount')),
      description: formData.get('description') as string
    })

    if (error) {
      setError(error.message)
    } else {
      setDebtDialogOpen(false)
      fetchData(params.id)
      ;(e.target as HTMLFormElement).reset()
    }
  }

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDebt) return

    const formData = new FormData(e.target as HTMLFormElement)
    
    const { error } = await createPayment({
      debt_id: selectedDebt.id,
      amount_paid: Number(formData.get('amount'))
    })

    if (error) {
      setError(error.message)
    } else {
      setPaymentDialogOpen(false)
      setSelectedDebt(null)
      fetchData(params.id)
      ;(e.target as HTMLFormElement).reset()
    }
  }

  const handleDeleteDebt = async (debtId: string) => {
    const { error } = await deleteDebt(debtId)
    if (error) {
      setError(error.message)
    } else {
      fetchData(params.id)
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    const { error } = await deletePayment(paymentId)
    if (error) {
      setError(error.message)
    } else {
      fetchData(params.id)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!debtor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Debtor not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{debtor.name}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Debtor Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Debtor Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <p className="text-gray-900">{debtor.phone || 'Not provided'}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-gray-900">{debtor.email || 'Not provided'}</p>
              </div>
              <div className="md:col-span-2">
                <Label>Notes</Label>
                <p className="text-gray-900">{debtor.notes || 'No notes'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(debtor.total_debt)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(debtor.remaining_balance)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(debtor.total_paid)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Debts Section */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Debts</CardTitle>
                <CardDescription>Manage debts and payments for this debtor</CardDescription>
              </div>
              <Dialog open={debtDialogOpen} onOpenChange={setDebtDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Debt
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Debt</DialogTitle>
                    <DialogDescription>
                      Add a new debt for {debtor.name}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddDebt} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount *</Label>
                      <Input
                        id="amount"
                        name="amount"
                        type="number"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        name="description"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setDebtDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Add Debt</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {debts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No debts found</p>
                <Button onClick={() => setDebtDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Debt
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {debts.map((debt) => {
                  const debtPayments = payments[debt.id] || []
                  const totalPaid = debtPayments.reduce((sum, payment) => sum + Number(payment.amount_paid), 0)
                  const remaining = Number(debt.amount) - totalPaid

                  return (
                    <Card key={debt.id} className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{formatCurrency(debt.amount)}</CardTitle>
                            <CardDescription>{debt.description || 'No description'}</CardDescription>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDebt(debt)
                                setPaymentDialogOpen(true)
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Payment
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteDebt(debt.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <Label className="text-xs text-gray-500">Original Amount</Label>
                            <p className="font-semibold">{formatCurrency(debt.amount)}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Total Paid</Label>
                            <p className="font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Remaining</Label>
                            <p className="font-semibold text-red-600">{formatCurrency(remaining)}</p>
                          </div>
                        </div>

                        {debtPayments.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Payment History</Label>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {debtPayments.map((payment) => (
                                  <TableRow key={payment.id}>
                                    <TableCell>{formatCurrency(payment.amount_paid)}</TableCell>
                                    <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeletePayment(payment.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment</DialogTitle>
              <DialogDescription>
                Add a payment for debt of {selectedDebt ? formatCurrency(selectedDebt.amount) : formatCurrency(0)}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPayment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentAmount">Payment Amount *</Label>
                <Input
                  id="paymentAmount"
                  name="amount"
                  type="number"
                  step="0.01"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Payment</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
