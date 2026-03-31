'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Inbox, Star, Send, Trash2, PenSquare, LogOut, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ComposeModal } from './compose-modal'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import type { Label } from '@/lib/types'

interface SidebarProps {
  activeLabel: Label
  unreadCount: number
  userEmail: string
  isAdmin: boolean
  onLabelChange: (label: Label) => void
}

const NAV_ITEMS: { label: Label; icon: React.ElementType; text: string }[] = [
  { label: 'inbox', icon: Inbox, text: 'Inbox' },
  { label: 'starred', icon: Star, text: 'Starred' },
  { label: 'sent', icon: Send, text: 'Sent' },
  { label: 'trash', icon: Trash2, text: 'Trash' },
]

export function Sidebar({ activeLabel, unreadCount, userEmail, isAdmin, onLabelChange }: SidebarProps) {
  const [composeOpen, setComposeOpen] = useState(false)

  async function handleSignOut() {
    await authClient.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r bg-background">
      <div className="p-3">
        <Button className="w-full gap-2" onClick={() => setComposeOpen(true)}>
          <PenSquare className="h-4 w-4" /> Compose
        </Button>
      </div>

      <nav className="flex-1 px-2">
        {NAV_ITEMS.map(({ label, icon: Icon, text }) => (
          <button
            key={label}
            onClick={() => onLabelChange(label)}
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors',
              activeLabel === label && 'bg-accent font-medium'
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1 text-left">{text}</span>
            {label === 'inbox' && unreadCount > 0 && (
              <Badge variant="default" className="text-xs">{unreadCount}</Badge>
            )}
          </button>
        ))}
      </nav>

      <Separator />

      <div className="p-3 space-y-1">
        <p className="truncate px-3 text-xs text-muted-foreground">{userEmail}</p>
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
          >
            <Shield className="h-4 w-4" /> Admin
          </Link>
        )}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>

      <ComposeModal open={composeOpen} onOpenChange={setComposeOpen} />
    </aside>
  )
}
