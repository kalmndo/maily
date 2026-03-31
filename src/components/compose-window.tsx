'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Maximize2, Minimize2, X } from 'lucide-react'
import { ComposeForm } from './compose-form'
import { cn } from '@/lib/utils'

interface ComposeWindowProps {
  open: boolean
  onClose: () => void
  defaultTo?: string
  defaultSubject?: string
  inReplyTo?: string
  // Increment to reset form (e.g. when opening a new compose)
  resetKey?: string | number
}

type Mode = 'floating' | 'minimized' | 'expanded'

export function ComposeWindow({
  open,
  onClose,
  defaultTo = '',
  defaultSubject = '',
  inReplyTo,
  resetKey,
}: ComposeWindowProps) {
  const [mode, setMode] = useState<Mode>('floating')

  // Reset to floating mode each time the window opens so a new compose
  // doesn't inherit the mode from the previous session.
  useEffect(() => {
    if (open) {
      setMode('floating')
    }
  }, [open])

  if (!open) return null

  const title = defaultSubject || 'New Message'
  const isExpanded = mode === 'expanded'
  const isMinimized = mode === 'minimized'

  return (
    <>
      {/* Backdrop — only visible in expanded mode */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setMode('floating')}
          />
        )}
      </AnimatePresence>

      {/* Compose window — single element, layout-animated between positions */}
      <motion.div
        layout
        role="dialog"
        aria-label="Compose email"
        aria-modal={isExpanded ? "true" : undefined}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'fixed z-50 flex flex-col overflow-hidden rounded-xl border bg-background shadow-2xl',
          isExpanded
            ? 'inset-x-0 inset-y-0 m-auto h-[80vh] w-[700px] max-w-[calc(100vw-2rem)]'
            : isMinimized
            ? 'bottom-0 right-4 w-[400px]'
            : 'bottom-0 right-4 h-[500px] w-[400px]'
        )}
      >
        {/* Title bar */}
        <div
          className="flex shrink-0 cursor-pointer items-center justify-between bg-foreground px-3 py-2"
          onDoubleClick={() => setMode(m => m === 'minimized' ? 'floating' : 'minimized')}
        >
          <span className="truncate text-sm font-medium text-background">
            {title}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              title={isMinimized ? 'Restore' : 'Minimize'}
              onClick={() => setMode(m => m === 'minimized' ? 'floating' : 'minimized')}
              className="rounded p-1 text-background/70 hover:bg-white/10 hover:text-background"
            >
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isMinimized && 'rotate-180')} />
            </button>
            <button
              type="button"
              title={isExpanded ? 'Collapse' : 'Expand'}
              onClick={() => setMode(m => m === 'expanded' ? 'floating' : 'expanded')}
              className="rounded p-1 text-background/70 hover:bg-white/10 hover:text-background"
            >
              {isExpanded
                ? <Minimize2 className="h-3.5 w-3.5" />
                : <Maximize2 className="h-3.5 w-3.5" />
              }
            </button>
            <button
              type="button"
              title="Close"
              onClick={onClose}
              className="rounded p-1 text-background/70 hover:bg-white/10 hover:text-background"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Form body — conditionally rendered so Framer Motion can animate it */}
        {!isMinimized && (
          <motion.div layout className="flex flex-1 flex-col overflow-hidden">
            <ComposeForm
              defaultTo={defaultTo}
              defaultSubject={defaultSubject}
              inReplyTo={inReplyTo}
              resetKey={resetKey}
              onSent={onClose}
            />
          </motion.div>
        )}
      </motion.div>
    </>
  )
}
