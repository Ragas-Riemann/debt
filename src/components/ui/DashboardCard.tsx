'use client'

import { Card, CardContent, CardHeader, CardTitle } from './card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface DashboardCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: string
    isPositive: boolean
  }
  className?: string
  children?: ReactNode
  cardStyle?: 'debtor' | 'creditor' | 'default'
}

export function DashboardCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  className,
  children,
  cardStyle = 'default'
}: DashboardCardProps) {
  const getCardStyles = () => {
    switch (cardStyle) {
      case 'debtor':
        return {
          borderLeft: '4px solid #5DADE2',
          iconColor: '#5DADE2',
          valueColor: '#5DADE2',
          titleColor: '#2C3E50'
        }
      case 'creditor':
        return {
          borderLeft: '4px solid #58D68D',
          iconColor: '#58D68D',
          valueColor: '#58D68D',
          titleColor: '#2C3E50'
        }
      default:
        return {
          borderLeft: '4px solid transparent',
          iconColor: '#2C3E50',
          valueColor: '#2C3E50',
          titleColor: '#2C3E50'
        }
    }
  }

  const styles = getCardStyles()

  return (
    <Card 
      className={cn('hover:shadow-md transition-shadow duration-200', className)}
      style={{ borderLeft: styles.borderLeft }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium" style={{ color: styles.titleColor }}>
          {title}
        </CardTitle>
        {Icon && (
          <Icon className="h-4 w-4" style={{ color: styles.iconColor }} />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" style={{ color: styles.valueColor }}>
          {value}
        </div>
        {description && (
          <p className="text-xs mt-1" style={{ color: '#2C3E50' }}>
            {description}
          </p>
        )}
        {trend && (
          <div className={cn(
            'text-xs mt-2 flex items-center gap-1',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  )
}
