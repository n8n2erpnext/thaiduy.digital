import { db, sqlClient } from '../src/db/client'
import { siteRegistry } from '../src/db/schema'
import { messages } from '../src/i18n/messages'

const en = messages.en
const vi = messages.vi

const sectionRows = [
  ['section.projects', en.sections.projects, vi.sections.projects, 10],
  ['section.writing', en.sections.writing, vi.sections.writing, 20],
  ['section.stack', en.sections.stack, vi.sections.stack, 30],
  ['section.about', en.sections.about, vi.sections.about, 40],
  ['section.guestbook', en.sections.guestbook, vi.sections.guestbook, 50],
].map(([key, enCopy, viCopy, sort]) => ({
  key: key as string,
  kind: 'section',
  enabled: true,
  status: 'published',
  sort: sort as number,
  labelEn: (enCopy as typeof en.sections.projects).eyebrow,
  labelVi: (viCopy as typeof vi.sections.projects).eyebrow,
  titleEn: (enCopy as typeof en.sections.projects).title,
  titleVi: (viCopy as typeof vi.sections.projects).title,
  summaryEn: (enCopy as typeof en.sections.projects).copy,
  summaryVi: (viCopy as typeof vi.sections.projects).copy,
  meta: {},
}))

const homeRows = [
  {
    key: 'home.hero',
    kind: 'section',
    enabled: true,
    status: 'published',
    sort: 1,
    labelEn: en.home.eyebrow,
    labelVi: vi.home.eyebrow,
    titleEn: en.home.title,
    titleVi: vi.home.title,
    summaryEn: en.home.lede,
    summaryVi: vi.home.lede,
    meta: {
      enter: { en: en.home.enter, vi: vi.home.enter },
      explore: { en: en.home.explore, vi: vi.home.explore },
      principlesLabel: { en: en.home.principlesLabel, vi: vi.home.principlesLabel },
      principles: { en: [...en.home.principles], vi: [...vi.home.principles] },
      fieldTop: { en: en.home.fieldTop, vi: vi.home.fieldTop },
      fieldTruth: { en: en.home.fieldTruth, vi: vi.home.fieldTruth },
      fieldFooter: { en: [...en.home.fieldFooter], vi: [...vi.home.fieldFooter] },
    },
  },
  {
    key: 'home.organs',
    kind: 'section',
    enabled: true,
    status: 'published',
    sort: 2,
    labelEn: en.home.organsEyebrow,
    labelVi: vi.home.organsEyebrow,
    titleEn: en.home.organsTitle,
    titleVi: vi.home.organsTitle,
    summaryEn: null,
    summaryVi: null,
    meta: {},
  },
  {
    key: 'home.surfaces',
    kind: 'section',
    enabled: true,
    status: 'published',
    sort: 3,
    labelEn: en.home.surfacesEyebrow,
    labelVi: vi.home.surfacesEyebrow,
    titleEn: en.home.surfacesTitle,
    titleVi: vi.home.surfacesTitle,
    summaryEn: null,
    summaryVi: null,
    meta: {},
  },
  {
    key: 'home.manifesto',
    kind: 'section',
    enabled: true,
    status: 'published',
    sort: 4,
    labelEn: 'MANIFESTO',
    labelVi: 'TUYÊN NGÔN',
    titleEn: null,
    titleVi: null,
    summaryEn: en.home.manifesto,
    summaryVi: vi.home.manifesto,
    meta: {
      lines: { en: [...en.home.manifestoMeta], vi: [...vi.home.manifestoMeta] },
    },
  },
]

const surfaces = en.home.surfaces.map((surface, index) => ({
  key: ['home.projects', 'home.writing', 'home.stack'][index],
  kind: 'home-surface',
  enabled: true,
  status: 'published',
  sort: (index + 1) * 10,
  labelEn: surface.kicker,
  labelVi: vi.home.surfaces[index].kicker,
  titleEn: surface.title,
  titleVi: vi.home.surfaces[index].title,
  summaryEn: surface.copy,
  summaryVi: vi.home.surfaces[index].copy,
  meta: { href: ['/projects', '/writing', '/stack'][index] },
}))

const navRows = [
  {
    key:'guestbook',
    kind:'nav',
    enabled:true,
    status:'published',
    sort:40,
    labelEn:'Discuss',
    labelVi:'Discuss',
    meta:{href:'/discuss'},
  },
]

const rows = [...sectionRows, ...homeRows, ...surfaces, ...navRows]

await db.insert(siteRegistry)
  .values(rows)
  .onConflictDoNothing({ target: siteRegistry.key })

console.log(`seeded_or_existing=${rows.length}`)
await sqlClient.end()
