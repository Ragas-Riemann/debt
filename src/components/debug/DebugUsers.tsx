'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function DebugUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function testUsersTable() {
      try {
        console.log('Testing users table access...')
        
        // Test 1: Simple count
        const { count, error: countError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
        
        console.log('Count result:', { count, countError })
        
        if (countError) {
          setError(`Count error: ${countError.message}`)
          return
        }

        // Test 2: Get all users
        const { data, error } = await supabase
          .from('users')
          .select('id, email, created_at')
          .order('email')
        
        console.log('All users result:', { data, error })
        
        if (error) {
          setError(`Data error: ${error.message}`)
        } else {
          setUsers(data || [])
          console.log(`Found ${data?.length || 0} users`)
        }
        
      } catch (err: any) {
        console.error('Test error:', err)
        setError(`Exception: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    testUsersTable()
  }, [])

  if (loading) return <div>Loading debug info...</div>

  return (
    <div className="p-4 border rounded-lg bg-yellow-50">
      <h3 className="font-bold mb-2">Debug: Users Table</h3>
      
      {error && (
        <div className="p-2 bg-red-100 text-red-700 rounded mb-2">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="text-sm">
        <p><strong>Total Users:</strong> {users.length}</p>
        
        {users.length > 0 && (
          <div className="mt-2">
            <strong>Sample Users:</strong>
            <ul className="ml-4 list-disc">
              {users.slice(0, 5).map((user) => (
                <li key={user.id}>{user.email} (ID: {user.id})</li>
              ))}
              {users.length > 5 && <li>... and {users.length - 5} more</li>}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
