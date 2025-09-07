// /pages/_app.tsx
import type { AppProps } from 'next/app'
import { useState } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { SWRConfig } from 'swr'
import { swrConfig } from '@/lib/fetcher'
import '@/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  const [supabaseClient] = useState(() => createPagesBrowserClient())

  return (
    <SessionContextProvider
      supabaseClient={supabaseClient}
      initialSession={pageProps.initialSession}
    >
      <SWRConfig value={swrConfig}>
        <Component {...pageProps} />
      </SWRConfig>
    </SessionContextProvider>
  )
}