import { user as authUser } from './auth-schema'
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
  source: varchar('source', { length: 24 }).default('upload').notNull(),
  sourceUrl: text('source_url'),
  creditName: text('credit_name'),
  creditUrl: text('credit_url'),
  status: varchar('status', { length: 16 }).default('ready').notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps,
}, table => [
  uniqueIndex('assets_storage_key_uq').on(table.storageKey),
  index('assets_status_idx').on(table.status, table.deletedAt),
])

export const writingTags = pgTable('writing_tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 64 }).notNull(),
  name: varchar('name', { length: 64 }).notNull(),
  color: varchar('color', { length: 7 }).default('#dfe8e2').notNull(),
  textColor: varchar('text_color', { length: 7 }).default('#172019').notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  ...timestamps,
}, table => [
  uniqueIndex('writing_tags_slug_uq').on(table.slug),
  index('writing_tags_enabled_idx').on(table.enabled, table.name),
])

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 180 }).notNull(),
  status: varchar('status', { length: 16 }).default('draft').notNull(),
  titleEn: text('title_en').default('').notNull(),
  titleVi: text('title_vi').default('').notNull(),
  excerptEn: text('excerpt_en'),
  excerptVi: text('excerpt_vi'),
  bodyEn: text('body_en').default('').notNull(),
  bodyVi: text('body_vi').default('').notNull(),
  coverAssetId: uuid('cover_asset_id').references(() => assets.id, { onDelete:'set null' }),
  seoTitleEn: text('seo_title_en'),
  seoTitleVi: text('seo_title_vi'),
  seoDescriptionEn: text('seo_description_en'),
  seoDescriptionVi: text('seo_description_vi'),
  highlight: boolean('highlight').default(false).notNull(),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  authorId: varchar('author_id', { length: 128 }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps,
}, table => [
  uniqueIndex('posts_slug_uq').on(table.slug),
  index('posts_status_idx').on(table.status, table.deletedAt, table.publishedAt),
])

export const articleLikes = pgTable('article_likes', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete:'cascade' }),
  userId: text('user_id').notNull().references(() => authUser.id, { onDelete:'cascade' }),
  createdAt: timestamp('created_at', { withTimezone:true }).defaultNow().notNull(),
}, table => [
  uniqueIndex('article_likes_post_user_uq').on(table.postId,table.userId),
  index('article_likes_post_idx').on(table.postId,table.createdAt),
])

export const articleComments = pgTable('article_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').notNull().references(() => posts.id, { onDelete:'cascade' }),
  userId: text('user_id').notNull().references(() => authUser.id, { onDelete:'cascade' }),
  body: text('body').notNull(),
  status: varchar('status', { length:16 }).default('pending').notNull(),
  moderatedBy: text('moderated_by'),
  moderatedAt: timestamp('moderated_at', { withTimezone:true }),
  deletedAt: timestamp('deleted_at', { withTimezone:true }),
  ...timestamps,
}, table => [
  index('article_comments_post_status_idx').on(table.postId,table.status,table.createdAt),
  index('article_comments_user_idx').on(table.userId,table.createdAt),
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

export const cvSnapshots = pgTable('cv_snapshots', {
  id: varchar('id', { length: 40 }).primaryKey(),
  locale: varchar('locale', { length: 2 }).notNull(),
  contentVersion: varchar('content_version', { length: 32 }).notNull(),
  contentHash: varchar('content_hash', { length: 64 }).notNull(),
  content: jsonb('content').$type<Record<string, unknown>>().notNull(),
  issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  revocationReason: text('revocation_reason'),
}, table => [
  index('cv_snapshots_issued_idx').on(table.issuedAt),
  index('cv_snapshots_hash_idx').on(table.contentHash),
])

export const contactMessages = pgTable('contact_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 160 }).notNull(),
  email: varchar('email', { length: 320 }).notNull(),
  phone: varchar('phone', { length: 80 }),
  message: text('message').notNull(),
  locale: varchar('locale', { length: 2 }).default('en').notNull(),
  status: varchar('status', { length: 24 }).default('new').notNull(),
  sourcePath: varchar('source_path', { length: 160 }).default('/about').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, table => [
  index('contact_messages_created_idx').on(table.createdAt),
  index('contact_messages_status_idx').on(table.status, table.createdAt),
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

export const hubDevices = pgTable('hub_devices', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 96 }).notNull(),
  platform: varchar('platform', { length: 24 }).default('android').notNull(),
  tokenHash: varchar('token_hash', { length: 64 }).notNull(),
  scopes: jsonb('scopes').$type<string[]>().default(['music:sensor:write']).notNull(),
  enabled: boolean('enabled').default(true).notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  ...timestamps,
}, table => [
  uniqueIndex('hub_devices_token_uq').on(table.tokenHash),
  index('hub_devices_enabled_idx').on(table.enabled, table.revokedAt),
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
