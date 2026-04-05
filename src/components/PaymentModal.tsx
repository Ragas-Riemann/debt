'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PesoSignIcon } from '@/components/ui/PesoSignIcon'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (amount: number) => Promise<void>
  creditorEmail: string
  maxAmount: number
  loading?: boolean
}

export function PaymentModal({
  isOpen,
  onClose,
  onSubmit,
  creditorEmail,
  maxAmount,
  loading = false
}: PaymentModalProps) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset error
    setError('')
    
    // Validation
    const numAmount = parseFloat(amount)
    
    if (!amount || isNaN(numAmount)) {
      setError('Please enter a valid amount')
      return
    }
    
    if (numAmount <= 0) {
      setError('Amount must be greater than 0')
      return
    }
    
    if (numAmount > maxAmount) {
      setError(`Amount cannot exceed remaining debt of ${maxAmount.toLocaleString()}`)
      return
    }
    
    try {
      await onSubmit(numAmount)
      setAmount('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to send payment request')
    }
  }

  const handleClose = () => {
    if (!loading) {
      setAmount('')
      setError('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PesoSignIcon className="h-5 w-5" />
            Send Payment Request
          </DialogTitle>
          <DialogDescription>
            Send a payment request to {creditorEmail}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-lg">₱</span>
                </div>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={maxAmount}
                  placeholder="₱ Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8"
                  disabled={loading}
                  required
                />
              </div>
              {maxAmount > 0 && (
                <p className="text-sm text-gray-500">
                  Remaining debt: ₱{maxAmount.toLocaleString()}
                </p>
              )}
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !amount}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
            >
              {loading ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
