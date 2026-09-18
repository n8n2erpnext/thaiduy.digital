import 'server-only'
import { getRegistryByKey } from '@/content/repository'
import { textFor, type ManagedRegistryItem } from '@/content/types'
import type { Locale } from '@/i18n/config'

export type SectionFallback = {
  eyebrow: string
  title: string
  copy: string
}

export type ManagedSectionPresentation = SectionFallback & {
  visible: boolean
  managed: boolean
  item: ManagedRegistryItem | null
}

export async function resolveManagedSection(
  key: string,
  locale: Locale,
  fallback: SectionFallback,
): Promise<ManagedSectionPresentation> {
  const item = await getRegistryByKey(key)
  if (!item) {
    return { ...fallback, visible: true, managed: false, item: null }
  }

  const visible = item.enabled && item.status === 'published' && !item.deletedAt
  if (!visible) {
    return { eyebrow: '', title: '', copy: '', visible: false, managed: true, item }
  }

  return {
    eyebrow: textFor(item.label, locale) || fallback.eyebrow,
    title: textFor(item.title, locale) || fallback.title,
    copy: textFor(item.summary, locale) || fallback.copy,
    visible: true,
    managed: true,
    item,
  }
}
