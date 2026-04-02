'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { getPendingRequests, acceptDebtRequest, rejectDebtRequest } from '@/lib/database'
import { formatCurrency } from '@/lib/currency'
import { useToast } from '@/hooks/use-toast'
import { 
  Clock, 
  Check, 
  X, 
  Mail, 
  DollarSign,
  ArrowUpRight,
  Users
} from 'lucide-react'
import { DebtRequest } from '@/lib/database'

interface PendingRequestsProps {
  currentUserId: string
  onRequestUpdated: () => void
}

export function PendingRequests({ currentUserId, onRequestUpdated }: PendingRequestsProps) {
  const [requests, setRequests] = useState<DebtRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchRequests()
  }, [currentUserId])

  const fetchRequests = async () => {
    try {
      const { data, error } = await getPendingRequests(currentUserId)
      
      if (error) {
        setError(error.message || 'Failed to load requests')
      } else {
        setRequests(data || [])
      }
    } catch (err: any) {
      setError('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (requestId: string) => {
    setProcessing(requestId)
    try {
      const { data, error } = await acceptDebtRequest(requestId)
      
      if (error) {
        toast({
          title: "Error",
          description: error.message || 'Failed to accept request',
          variant: "destructive",
        })
      } else {
        toast({
          title: "Request Accepted",
          description: "Debt relationship has been created successfully",
        })
        onRequestUpdated()
        fetchRequests()
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to accept request",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (requestId: string) => {
    setProcessing(requestId)
    try {
      const { data, error } = await rejectDebtRequest(requestId)
      
      if (error) {
        toast({
          title: "Error", 
          description: error.message || 'Failed to reject request',
          variant: "destructive",
        })
      } else {
        toast({
          title: "Request Rejected",
          description: "The request has been rejected",
        })
        onRequestUpdated()
        fetchRequests()
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  // Filter requests where current user is the recipient
  const incomingRequests = requests.filter(req => req.to_user_id === currentUserId)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="sm" />
            <span className="ml-2 text-sm text-gray-500">Loading requests...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Requests
          {incomingRequests.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {incomingRequests.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {incomingRequests.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No pending requests"
            description="You don't have any pending debt requests at the moment."
          />
        ) : (
          <div className="space-y-4">
            {incomingRequests.map((request) => (
              <Card key={request.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        {request.type === 'debtor' ? (
                          <Users className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-semibold">
                          {request.type === 'debtor' ? 'Debtor Request' : 'Creditor Request'}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <p className="text-sm font-medium">
                            From: {request.from_user?.email}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(request.amount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Requested on {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(request.id)}
                        disabled={processing === request.id}
                        className="min-w-[80px] bg-green-600 hover:bg-green-700"
                      >
                        {processing === request.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Accept
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(request.id)}
                        disabled={processing === request.id}
                        className="min-w-[80px] border-red-200 text-red-600 hover:bg-red-50"
                      >
                        {processing === request.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <X className="h-3 w-3 mr-1" />
                            Reject
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
