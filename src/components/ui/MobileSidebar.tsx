'use client'

import { useState } from 'react'
import { Button } from './button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './sheet'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'

interface MobileSidebarProps {
  items: Array<{
    title: string
    href: string
    icon: any
  }>
}

export function MobileSidebar({ items }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>
        <Sidebar items={items} />
      </SheetContent>
    </Sheet>
  )
}
