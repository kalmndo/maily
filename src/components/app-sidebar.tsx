"use client"

import * as React from "react"
import { InboxIcon, SendIcon, StarIcon, Trash2Icon, SquarePenIcon } from "lucide-react"
import { formatDistanceToNow } from "@/lib/format-date"
import type { EmailRow, SentRow, Label as LabelType } from "@/lib/types"

import { NavUser } from "@/components/nav-user"
import { Label } from "@/components/ui/label"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"

const navMain = [
  { title: "Inbox",   url: "#", icon: <InboxIcon />,  label: "inbox"   as LabelType },
  { title: "Starred", url: "#", icon: <StarIcon />,   label: "starred" as LabelType },
  { title: "Sent",    url: "#", icon: <SendIcon />,   label: "sent"    as LabelType },
  { title: "Trash",   url: "#", icon: <Trash2Icon />, label: "trash"   as LabelType },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeLabel: LabelType
  emails: (EmailRow | SentRow)[]
  selectedId: string | null
  loading: boolean
  userEmail: string
  isAdmin: boolean
  onLabelChange: (label: LabelType) => void
  onEmailSelect: (id: string) => void
  onCompose: () => void
}

const LABELS_WITH_READ_STATE: LabelType[] = ["inbox", "starred", "trash"]

export function AppSidebar({ activeLabel, emails, selectedId, loading, userEmail, isAdmin, onLabelChange, onEmailSelect, onCompose, ...props }: AppSidebarProps) {
  const [activeItem, setActiveItem] = React.useState(navMain[0])
  const [unreadsOnly, setUnreadsOnly] = React.useState(false)
  const { setOpen } = useSidebar()

  const hasReadState = LABELS_WITH_READ_STATE.includes(activeLabel)
  const visibleEmails = unreadsOnly && hasReadState
    ? emails.filter((e) => "read" in e && !e.read)
    : emails

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* This is the first sidebar */}
      {/* We disable collapsible and adjust width to icon. */}
      {/* This will make the sidebar appear as icons. */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <a href="#">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-serif text-lg font-semibold">
                    M
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        setActiveItem(item)
                        onLabelChange(item.label)
                        setOpen(true)
                      }}
                      isActive={activeItem?.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                tooltip={{ children: "Compose", hidden: false }}
                onClick={onCompose}
                className="px-2.5 md:px-2"
              >
                <SquarePenIcon />
                <span>Compose</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <NavUser user={{ name: userEmail.split("@")[0], email: userEmail, avatar: "" }} />
        </SidebarFooter>
      </Sidebar>

      {/* This is the second sidebar */}
      {/* We disable collapsible and let it fill remaining space */}
      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-base font-medium text-foreground">
              {activeItem?.title}
            </div>
            {hasReadState && (
              <Label className="flex items-center gap-2 text-sm">
                <span>Unreads</span>
                <Switch
                  className="shadow-none"
                  checked={unreadsOnly}
                  onCheckedChange={setUnreadsOnly}
                />
              </Label>
            )}
          </div>
          <SidebarInput placeholder="Type to search..." />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
            <SidebarGroupContent>
              {visibleEmails.map((email) => {
                const isSent = activeLabel === "sent"
                const isUnread = "read" in email && !email.read
                const name = isSent
                  ? ("toEmail" in email ? email.toEmail : "")
                  : ("fromName" in email && email.fromName) || ("fromEmail" in email ? email.fromEmail : "")
                return (
                  <a
                    href="#"
                    key={email.id}
                    onClick={(e) => { e.preventDefault(); onEmailSelect(email.id) }}
                    className="flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <div className="flex w-full items-center gap-2">
                      <span className={isUnread ? "font-semibold" : ""}>{name}</span>
                      {isUnread && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
                      <span className="ml-auto text-xs">{formatDistanceToNow(email.date)}</span>
                    </div>
                    <span className="font-medium">{email.subject ?? "(no subject)"}</span>
                    <span className="line-clamp-2 w-[260px] text-xs whitespace-break-spaces">
                      {email.subject ?? ""}
                    </span>
                  </a>
                )
              })}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </Sidebar>
  )
}
