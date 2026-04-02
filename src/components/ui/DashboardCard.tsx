'use client'

import { Card, CardContent, CardHeader, CardDescription } from './card'
import { Badge } from './badge'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { PesoSignIcon } from './PesoSignIcon'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

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
  cardStyle?: 'debtor' | 'creditor' | 'default' | 'income' | 'expense'
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
  const styles = {
    debtor: {
      gradient: 'bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50',
      border: 'border-indigo-100/70',
      icon: 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25',
      badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      title: 'text-indigo-900',
      value: 'text-indigo-700',
      trend: 'text-indigo-600'
    },
    creditor: {
      gradient: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50',
      border: 'border-emerald-100/70',
      icon: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      title: 'text-emerald-900',
      value: 'text-emerald-700',
      trend: 'text-emerald-600'
    },
    income: {
      gradient: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50',
      border: 'border-green-100/70',
      icon: 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25',
      badge: 'bg-green-100 text-green-700 border-green-200',
      title: 'text-green-900',
      value: 'text-green-700',
      trend: 'text-green-600'
    },
    expense: {
      gradient: 'bg-gradient-to-br from-red-50 via-rose-50 to-pink-50',
      border: 'border-red-100/70',
      icon: 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25',
      badge: 'bg-red-100 text-red-700 border-red-200',
      title: 'text-red-900',
      value: 'text-red-700',
      trend: 'text-red-600'
    },
    default: {
      gradient: 'bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50',
      border: 'border-slate-100/70',
      icon: 'bg-gradient-to-br from-slate-500 to-gray-600 text-white shadow-lg shadow-slate-500/25',
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      title: 'text-slate-900',
      value: 'text-slate-700',
      trend: 'text-slate-600'
    }
  }

  const style = styles[cardStyle]

  return (
    <Card className={cn(
      'relative overflow-hidden border backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.02] group',
      style.gradient,
      style.border,
      className
    )}>
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent"></div>
      </div>
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex flex-col gap-1.5">
          <CardDescription className={cn('text-xs font-semibold uppercase tracking-wider opacity-80', style.title)}>
            {title}
          </CardDescription>
        </div>
        {Icon && (
          <div className={cn(
            'p-3 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3',
            style.icon
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardHeader>
      <CardContent className="relative">
        <div className={cn('text-3xl font-bold tracking-tight mb-2', style.value)}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground/80 mb-3 leading-relaxed">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(
                'text-xs font-medium px-2.5 py-1 transition-colors',
                style.badge
              )}
            >
              <div className="flex items-center gap-1">
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{trend.value}</span>
              </div>
            </Badge>
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  )
}
