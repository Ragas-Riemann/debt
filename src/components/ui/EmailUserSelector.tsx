'use client'

import { useState, useEffect } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Card, CardContent } from './card'
import { LoadingSpinner } from './LoadingSpinner'
import { Search, Mail, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { User } from '@/lib/database'

interface EmailUserSelectorProps {
  currentUserId: string
  onUserSelect: (user: User) => void
  selectedUser?: User | null
  placeholder?: string
  className?: string
}

export function EmailUserSelector({ 
  currentUserId, 
  onUserSelect, 
  selectedUser, 
  placeholder = "Search users by email...",
  className 
}: EmailUserSelectorProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [currentUserId])

  useEffect(() => {
    const filtered = users.filter(user => 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [searchQuery, users])

  const fetchUsers = async () => {
    try {
      const { getUsersForSelection } = await import('@/lib/database')
      const { data, error } = await getUsersForSelection(currentUserId)
      
      if (error) {
        console.error('Error fetching users:', error)
      } else {
        setUsers(data || [])
        setFilteredUsers(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserClick = (user: User) => {
    onUserSelect(user)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClearSelection = () => {
    onUserSelect(null as any)
    setSearchQuery('')
  }

  return (
    <div className={cn('relative', className)}>
      <Label className="text-sm font-medium">Select User by Email</Label>
      
      {selectedUser ? (
        <div className="mt-2 p-3 border rounded-md bg-green-50 border-green-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-green-600" />
            <div>
              <p className="font-medium text-green-900">{selectedUser.email}</p>
              <p className="text-xs text-green-600">Selected user</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearSelection}
            className="text-green-600 hover:text-green-700 hover:bg-green-100"
          >
            Clear
          </Button>
        </div>
      ) : (
        <div className="mt-2 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              className="pl-10"
            />
          </div>
          
          {isOpen && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto shadow-lg border-gray-200">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 text-sm text-gray-500">Loading users...</span>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    {searchQuery ? 'No users found with that email' : 'No available users'}
                  </div>
                ) : (
                  <div className="py-1">
                    {filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserClick(user)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <Mail className="h-4 w-4 text-gray-400" />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">{user.email}</p>
                          <p className="text-xs text-gray-500">Click to select</p>
                        </div>
                        <Check className="h-4 w-4 text-transparent group-hover:text-gray-400" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
