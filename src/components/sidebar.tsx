'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Inbox, Star, Send, Trash2, PenSquare, LogOut, Shield } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { ComposeModal } from './compose-modal'
import { authClient } from '@/lib/auth-client'
import type { Label } from '@/lib/types'

interface AppSidebarProps {
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

export function AppSidebar({ activeLabel, unreadCount, userEmail, isAdmin, onLabelChange }: AppSidebarProps) {
  const [composeOpen, setComposeOpen] = useState(false)

  async function handleSignOut() {
    await authClient.signOut()
    window.location.href = '/login'
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Compose"
              onClick={() => setComposeOpen(true)}
            >
              <PenSquare />
              <span>Compose</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV_ITEMS.map(({ label, icon: Icon, text }) => (
              <SidebarMenuItem key={label}>
                <SidebarMenuButton
                  isActive={activeLabel === label}
                  tooltip={text}
                  onClick={() => onLabelChange(label)}
                  className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                >
                  <Icon />
                  <span>{text}</span>
                </SidebarMenuButton>
                {label === 'inbox' && unreadCount > 0 && (
                  <SidebarMenuBadge>{unreadCount}</SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Admin">
                <Link href="/admin"><Shield /><span>Admin</span></Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sign out" onClick={handleSignOut}>
              <LogOut /><span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <ComposeModal open={composeOpen} onOpenChange={setComposeOpen} />
    </Sidebar>
  )
}
