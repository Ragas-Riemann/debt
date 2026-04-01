'use client'

import { cn } from '@/lib/utils'
import { Button } from './button'
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarItem {
  title: string
  href: string
  icon: LucideIcon
}

interface SidebarProps {
  items: SidebarItem[]
  className?: string
}

export function Sidebar({ items, className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn(
      'w-64 bg-white border-r border-gray-200 min-h-screen p-6',
      className
    )}>
      {/* Logo/Brand */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900">
          Debt Tracker
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Manage your debts easily
        </p>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {items.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="text-xs text-gray-400">
          © 2024 Debt Tracker
        </div>
      </div>
    </div>
  )
}
