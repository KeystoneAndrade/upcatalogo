'use client'

import { createContext, useContext } from 'react'

interface TenantSettings {
  open_cart_on_add?: boolean
}

const TenantSettingsContext = createContext<TenantSettings>({})

export function TenantSettingsProvider({
  settings,
  children,
}: {
  settings: TenantSettings
  children: React.ReactNode
}) {
  return (
    <TenantSettingsContext.Provider value={settings}>
      {children}
    </TenantSettingsContext.Provider>
  )
}

export function useTenantSettings() {
  return useContext(TenantSettingsContext)
}
