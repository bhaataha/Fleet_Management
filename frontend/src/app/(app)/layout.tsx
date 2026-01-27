import { ReactNode } from 'react'
import ResponsiveLayout from '@/components/ResponsiveLayout'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ResponsiveLayout>
      {children}
    </ResponsiveLayout>
  )
}
