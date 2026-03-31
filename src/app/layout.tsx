import type { Metadata } from 'next'
import { Geist, Geist_Mono, Lora } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: 'Maily',
  description: 'Personal email client',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable, geistMono.variable, lora.variable)}>
      <body className="font-sans"><TooltipProvider>{children}</TooltipProvider></body>
    </html>
  )
}
