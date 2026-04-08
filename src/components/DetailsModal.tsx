'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatCurrency } from '@/lib/currency'
import { supabase } from '@/lib/supabase'
import { 
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  User
} from 'lucide-react'
import { PesoSignIcon } from '@/components/ui/PesoSignIcon'

interface Payment {
  id: string
  amount: number
  created_at: string
}

interface DetailsModalProps {
  isOpen: boolean
  onClose: () => void
  person: any
  type: 'debtor' | 'creditor'
}

export function DetailsModal({
  isOpen,
  onClose,
  person,
  type
}: DetailsModalProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const userEmail = type === 'debtor' ? person.debtor?.email : person.creditor?.email
  
  // Calculate debt information
  // Get the raw values from database
  const dbAmount = parseFloat(person.amount) || 0
  const dbRemaining = parseFloat(person.remaining_amount) || 0
  
  // Database has fields swapped: amount = remaining, remaining_amount = original
  // So we swap them for correct display
  const originalDebt = dbRemaining || dbAmount || 0
  const remainingBalance = dbAmount || 0
  const totalPaid = originalDebt - remainingBalance
  
  const dateBorrowed = person.created_at ? new Date(person.created_at).toLocaleDateString() : 'N/A'
  
  // Use deadline from database if available, otherwise calculate
  const deadline = person.deadline ? 
    new Date(person.deadline).toLocaleDateString() :
    person.created_at ? 
      new Date(new Date(person.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString() : 
      'N/A'

  useEffect(() => {
    if (isOpen && person) {
      fetchPayments()
    }
  }, [isOpen, person])

  const fetchPayments = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Get the debtor and creditor IDs
      const debtorId = person.debtor_id
      const creditorId = person.creditor_id
      
      // Fetch accepted payment requests between this debtor and creditor
      const { data: paymentData, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('debtor_id', debtorId)
        .eq('creditor_id', creditorId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Payment history error:', error)
        setError('Failed to load payment history')
        setPayments([])
      } else {
        setPayments(paymentData || [])
      }
      
    } catch (err: any) {
      console.error('Failed to fetch payments:', err)
      setError('Failed to load payment history')
      setPayments([])
    } finally {
      setLoading(false)
    }
  }


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {userEmail}
          </DialogTitle>
          <DialogDescription>
            {type === 'debtor' ? 'Debtor' : 'Creditor'} Details and Payment History
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Debt Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Original Debt</p>
                    <p className="text-xl font-bold text-indigo-600">
                      {formatCurrency(originalDebt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date Borrowed</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {dateBorrowed}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Payment Deadline</p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {deadline}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <Badge variant="outline" className={remainingBalance > 0 ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-green-50 text-green-700 border-green-200"}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {remainingBalance > 0 ? 'Active' : 'Paid'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 mb-1">
                    {type === 'debtor' ? 'Total Paid to You' : 'Total Paid by You'}
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(totalPaid)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {originalDebt > 0 && remainingBalance >= 0 && (
                      <>{((totalPaid / originalDebt) * 100).toFixed(0)}% paid</>
                    )}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-orange-600 mb-1">Remaining Balance</p>
                  <p className="text-2xl font-bold text-orange-700">
                    {formatCurrency(remainingBalance)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PesoSignIcon className="h-5 w-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="sm" className="mr-2" />
                  <span>Loading payment history...</span>
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No payments recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-green-600">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(payment.created_at)}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Paid
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
