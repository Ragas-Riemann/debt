'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
import { formatCurrency } from '@/lib/currency'
import { Bell, Mail } from 'lucide-react'

interface ReminderModalProps {
  isOpen: boolean
  onClose: () => void
  debtor: any
  onSendReminder: (message: string) => Promise<void>
  loading?: boolean
}

export function ReminderModal({
  isOpen,
  onClose,
  debtor,
  onSendReminder,
  loading = false
}: ReminderModalProps) {
  const [messageMode, setMessageMode] = useState<'auto' | 'custom'>('auto')
  const [customMessage, setCustomMessage] = useState('')
  const [error, setError] = useState('')

  // Generate auto message
  const generateAutoMessage = () => {
    const totalDebt = parseFloat(debtor.amount) || 0
    const amountPaid = parseFloat(debtor.total_paid) || 0
    const remainingBalance = totalDebt - amountPaid
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 7) // 7 days from now

    return `Hi ${debtor.debtor.email},

This is a friendly reminder about your outstanding debt.

📊 Debt Summary:
• Total Debt: ${formatCurrency(totalDebt)}
• Amount Paid: ${formatCurrency(amountPaid)}
• Remaining Balance: ${formatCurrency(remainingBalance)}
• Payment Deadline: ${deadline.toLocaleDateString()}

Please settle your remaining balance as soon as possible. If you have any questions or need to arrange a payment plan, please don't hesitate to contact me.

Thank you!
${debtor.creditor?.email || 'Your creditor'}`
  }

  const autoMessage = generateAutoMessage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset error
    setError('')
    
    const message = messageMode === 'auto' ? autoMessage : customMessage
    
    if (!message.trim()) {
      setError('Please enter a message')
      return
    }
    
    try {
      await onSendReminder(message)
      setMessageMode('auto')
      setCustomMessage('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to send reminder')
    }
  }

  const handleClose = () => {
    if (!loading) {
      setMessageMode('auto')
      setCustomMessage('')
      setError('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Send Reminder to {debtor.debtor.email}
          </DialogTitle>
          <DialogDescription>
            Send a payment reminder to your debtor
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Debtor Info */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-slate-600" />
                <span className="font-medium text-slate-900">{debtor.debtor.email}</span>
              </div>
              <div className="text-sm text-slate-600">
                Outstanding Amount: <span className="font-semibold text-indigo-600">{formatCurrency(debtor.amount || 0)}</span>
              </div>
            </div>

            {/* Message Mode Selection */}
            <div className="grid gap-2">
              <Label>Message Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={messageMode === 'auto' ? 'default' : 'outline'}
                  onClick={() => setMessageMode('auto')}
                  className="flex-1"
                  disabled={loading}
                >
                  Auto-generated
                </Button>
                <Button
                  type="button"
                  variant={messageMode === 'custom' ? 'default' : 'outline'}
                  onClick={() => setMessageMode('custom')}
                  className="flex-1"
                  disabled={loading}
                >
                  Custom Message
                </Button>
              </div>
            </div>

            {/* Message Content */}
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              {messageMode === 'auto' ? (
                <div className="border rounded-md p-3 bg-slate-50">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                    {autoMessage}
                  </pre>
                </div>
              ) : (
                <Textarea
                  id="message"
                  placeholder="Enter your custom message..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={8}
                  disabled={loading}
                  required
                />
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
              disabled={loading}
              className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white hover:from-indigo-600 hover:to-blue-700"
            >
              {loading ? 'Sending...' : 'Send Reminder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
