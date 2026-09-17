import type { Locale } from '@/i18n/config'

export type RegistryKind = 'nav' | 'project' | 'stack-node' | 'home-surface' | 'section' | 'feature'
export type RegistryStatus = 'draft' | 'published' | 'archived'

export type LocalizedText = { en: string; vi: string }

export type ManagedRegistryItem = {
  id: string
  key: string
  kind: RegistryKind
  enabled: boolean
  status: RegistryStatus
  sort: number
  parentKey?: string | null
  label: LocalizedText
  title?: LocalizedText
  summary?: LocalizedText
  meta?: Record<string, unknown>
  runtimeKey?: string | null
  deletedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

export const textFor = (item: LocalizedText | undefined, locale: Locale) => item?.[locale] ?? ''
