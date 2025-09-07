// /components/Layout.tsx
import { ReactNode } from 'react'
import Head from 'next/head'
import Navigation from './Navigation'

interface LayoutProps {
  children: ReactNode
  title?: string
  showNavigation?: boolean
  className?: string
}

export default function Layout({ 
  children, 
  title = 'Expense Tracker',
  showNavigation = true,
  className = ''
}: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        <main className={showNavigation ? 'pb-20' : ''}>
          {children}
        </main>
        
        {showNavigation && <Navigation />}
      </div>
    </>
  )
}