import {
  bigint,
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}

export const siteRegistry = pgTable('site_registry', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 128 }).notNull(),
  kind: varchar('kind', { length: 32 }).notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  status: varchar('status', { length: 16 }).default('draft').notNull(),
  sort: integer('sort').default(0).notNull(),
  parentKey: varchar('parent_key', { length: 128 }),
  labelEn: text('label_en').notNull(),
  labelVi: text('label_vi').notNull(),
  titleEn: text('title_en'),
  titleVi: text('title_vi'),
  summaryEn: text('summary_en'),
  summaryVi: text('summary_vi'),
  meta: jsonb('meta').$type<Record<string, unknown>>().default({}).notNull(),
  runtimeKey: varchar('runtime_key', { length: 128 }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps,
}, table => [
  uniqueIndex('site_registry_key_uq').on(table.key),
  index('site_registry_public_idx').on(table.kind, table.enabled, table.status, table.sort),
])

export const siteSettings = pgTable('site_settings', {
  key: varchar('key', { length: 128 }).primaryKey(),
  value: jsonb('value').$type<unknown>().notNull(),
  updatedBy: varchar('updated_by', { length: 128 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const featureFlags = pgTable('feature_flags', {
  key: varchar('key', { length: 128 }).primaryKey(),
  enabled: boolean('enabled').default(false).notNull(),
  config: jsonb('config').$type<Record<string, unknown>>().default({}).notNull(),
  descriptionEn: text('description_en'),
  descriptionVi: text('description_vi'),
  updatedBy: varchar('updated_by', { length: 128 }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const runtimeBindings = pgTable('runtime_bindings', {
  id: uuid('id').defaultRandom().primaryKey(),
  registryKey: varchar('registry_key', { length: 128 }).notNull(),
  source: varchar('source', { length: 128 }).notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  publicFields: jsonb('public_fields').$type<string[]>().default([]).notNull(),
  config: jsonb('config').$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
}, table => [
  uniqueIndex('runtime_binding_source_uq').on(table.registryKey, table.source),
  index('runtime_binding_enabled_idx').on(table.enabled),
])

export const assets = pgTable('assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  storageKey: text('storage_key').notNull(),
  fileName: text('file_name').notNull(),
  mimeType: varchar('mime_type', { length: 160 }).notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  publicUrl: text('public_url'),
  altEn: text('alt_en'),
  altVi: text('alt_vi'),
  status: varchar('status', { length: 16 }).default('ready').notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps,
}, table => [
  uniqueIndex('assets_storage_key_uq').on(table.storageKey),
  index('assets_status_idx').on(table.status, table.deletedAt),
])

export const revisions = pgTable('revisions', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: varchar('entity_type', { length: 64 }).notNull(),
  entityId: varchar('entity_id', { length: 160 }).notNull(),
  action: varchar('action', { length: 32 }).notNull(),
  before: jsonb('before'),
  after: jsonb('after'),
  actorId: varchar('actor_id', { length: 128 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('revisions_entity_idx').on(table.entityType, table.entityId, table.createdAt),
])

export const auditLogs = pgTable('audit_logs', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  actorId: varchar('actor_id', { length: 128 }),
  action: varchar('action', { length: 64 }).notNull(),
  entityType: varchar('entity_type', { length: 64 }),
  entityId: varchar('entity_id', { length: 160 }),
  requestId: uuid('request_id').defaultRandom().notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('audit_logs_created_idx').on(table.createdAt),
  index('audit_logs_entity_idx').on(table.entityType, table.entityId),
])

export const brainProfiles = pgTable('brain_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  brainKey: varchar('brain_key', { length: 128 }).notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  leftConfig: jsonb('left_config').$type<Record<string, unknown>>().default({}).notNull(),
  rightConfig: jsonb('right_config').$type<Record<string, unknown>>().default({}).notNull(),
  cortexConfig: jsonb('cortex_config').$type<Record<string, unknown>>().default({}).notNull(),
  memoryConfig: jsonb('memory_config').$type<Record<string, unknown>>().default({}).notNull(),
  ...timestamps,
}, table => [
  uniqueIndex('brain_profiles_key_uq').on(table.brainKey),
])

export const brainMemory = pgTable('brain_memory', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  brainKey: varchar('brain_key', { length: 128 }).notNull(),
  hemisphere: varchar('hemisphere', { length: 16 }).notNull(),
  memoryKey: varchar('memory_key', { length: 220 }).notNull(),
  value: jsonb('value').$type<unknown>().notNull(),
  confidence: doublePrecision('confidence').default(0).notNull(),
  learnedAt: timestamp('learned_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
}, table => [
  uniqueIndex('brain_memory_key_uq').on(table.brainKey, table.hemisphere, table.memoryKey),
  index('brain_memory_lookup_idx').on(table.brainKey, table.hemisphere, table.learnedAt),
])

export const trafficSessions = pgTable('traffic_sessions', {
  id: uuid('id').primaryKey(),
  firstAt: timestamp('first_at', { withTimezone: true }).defaultNow().notNull(),
  lastAt: timestamp('last_at', { withTimezone: true }).defaultNow().notNull(),
  landingPath: text('landing_path').notNull(),
  referrerDomain: text('referrer_domain'),
  country: varchar('country', { length: 8 }),
  language: varchar('language', { length: 32 }),
  browser: varchar('browser', { length: 80 }),
  os: varchar('os', { length: 80 }),
  device: varchar('device', { length: 40 }),
  visits: integer('visits').default(1).notNull(),
  views: integer('views').default(0).notNull(),
  events: integer('events').default(0).notNull(),
}, table => [
  index('traffic_sessions_last_idx').on(table.lastAt),
  index('traffic_sessions_country_idx').on(table.country),
])
export const trafficEvents = pgTable('traffic_events', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  sessionId: uuid('session_id').notNull(),
  visitId: uuid('visit_id').notNull(),
  type: varchar('type', { length: 24 }).notNull(),
  name: varchar('name', { length: 160 }),
  path: text('path').notNull(),
  query: text('query'),
  title: text('title'),
  referrerDomain: text('referrer_domain'),
  country: varchar('country', { length: 8 }),
  language: varchar('language', { length: 32 }),
  browser: varchar('browser', { length: 80 }),
  os: varchar('os', { length: 80 }),
  device: varchar('device', { length: 40 }),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  utmContent: text('utm_content'),
  utmTerm: text('utm_term'),
  properties: jsonb('properties').$type<Record<string, unknown>>().default({}).notNull(),
  lcp: doublePrecision('lcp'),
  inp: doublePrecision('inp'),
  cls: doublePrecision('cls'),
  fcp: doublePrecision('fcp'),
  ttfb: doublePrecision('ttfb'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('traffic_events_created_idx').on(table.createdAt),
  index('traffic_events_session_idx').on(table.sessionId, table.createdAt),
  index('traffic_events_visit_idx').on(table.visitId, table.createdAt),
  index('traffic_events_path_idx').on(table.path, table.createdAt),
  index('traffic_events_name_idx').on(table.name, table.createdAt),
])
