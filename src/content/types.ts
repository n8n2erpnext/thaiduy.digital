import type { Locale } from '@/i18n/config'

export type RegistryKind = 'nav' | 'project' | 'stack-node' | 'home-surface' | 'section' | 'feature' | 'organ'
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

export function metaText(
  meta: Record<string, unknown> | undefined,
  key: string,
  locale: Locale,
  fallback = '',
) {
  const value = meta?.[key]
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const localized = value as Record<string, unknown>
    const selected = localized[locale]
    if (typeof selected === 'string') return selected
  }
  return fallback
}

export function metaList(
  meta: Record<string, unknown> | undefined,
  key: string,
  locale: Locale,
  fallback: readonly string[] = [],
) {
  const value = meta?.[key]
  if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
    return value as string[]
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const localized = value as Record<string, unknown>
    const selected = localized[locale]
    if (Array.isArray(selected) && selected.every(item => typeof item === 'string')) {
      return selected as string[]
    }
  }
  return [...fallback]
}
