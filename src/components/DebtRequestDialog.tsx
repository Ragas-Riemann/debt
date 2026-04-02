'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/ui/FormInput'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmailUserSelector } from '@/components/ui/EmailUserSelector'
import { createDebtRequest, checkExistingRequest } from '@/lib/database'
import { formatCurrency } from '@/lib/currency'
import { useToast } from '@/hooks/use-toast'
import { Plus, Mail, DollarSign, Users, ArrowUpRight } from 'lucide-react'
import { User } from '@/lib/database'

interface DebtRequestDialogProps {
  currentUserId: string
  type: 'debtor' | 'creditor'
  onRequestSent: () => void
}

export function DebtRequestDialog({ currentUserId, type, onRequestSent }: DebtRequestDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [amount, setAmount] = useState('')
  const { toast } = useToast()

  console.log('DebtRequestDialog rendered with currentUserId:', currentUserId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!selectedUser) {
      setError('Please select a user')
      setLoading(false)
      return
    }

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than 0')
      setLoading(false)
      return
    }

    try {
      // Check for existing requests
      const { data: existingRequest } = await checkExistingRequest(
        currentUserId,
        selectedUser.id,
        type
      )

      if (existingRequest) {
        setError(`A ${type} request to this user already exists (${existingRequest.status})`)
        setLoading(false)
        return
      }

      // Create the debt request
      const { data, error } = await createDebtRequest(
        currentUserId,
        selectedUser.id,
        type,
        amountNum
      )

      if (error) {
        setError(error.message || 'Failed to send request')
      } else {
        toast({
          title: "Request Sent Successfully",
          description: `${type === 'debtor' ? 'Debtor' : 'Creditor'} request sent to ${selectedUser.email}`,
        })
        setOpen(false)
        setSelectedUser(null)
        setAmount('')
        onRequestSent()
      }
    } catch (err: any) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setError('')
      setSelectedUser(null)
      setAmount('')
    }
  }

  const typeConfig = {
    debtor: {
      title: 'Add Debtor Request',
      description: 'Send a request to track money owed to you',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    creditor: {
      title: 'Add Creditor Request', 
      description: 'Send a request to track money you owe',
      icon: ArrowUpRight,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  }

  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className={type === 'creditor' ? 'bg-red-600 hover:bg-red-700' : ''}>
          <Plus className="h-4 w-4 mr-2" />
          {config.title}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            {config.title}
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Selection */}
          <div className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
            <div className="flex items-center gap-2 mb-3">
              <Mail className={`h-4 w-4 ${config.color}`} />
              <span className="font-medium text-sm">Select User</span>
            </div>
            <EmailUserSelector
              currentUserId={currentUserId}
              onUserSelect={setSelectedUser}
              selectedUser={selectedUser}
              placeholder="Search by email address..."
            />
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <FormInput
              label="Amount (PHP)"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={loading}
              helperText="Enter amount in Philippine Peso"
            />
          </div>

          {/* Amount Preview */}
          {amount && !isNaN(parseFloat(amount)) && (
            <div className={`p-4 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Request Amount:</span>
                <span className={`text-lg font-bold ${config.color}`}>
                  {formatCurrency(parseFloat(amount))}
                </span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !selectedUser || !amount}
              className={type === 'creditor' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Sending Request...
                </>
              ) : (
                'Send Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
