/**
 * Official UK register lookups. Companies House supplies the companies (searched by
 * SIC code, i.e. businesses that likely hold stock); HMRC's VAT Check API verifies a
 * VAT number against the business. Keys stay on the server. Results are saved to
 * Netlify Database so thousands of leads can be browsed without re-fetching.
 */
import { createServerFn } from '@tanstack/react-start'
import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { registerCompanies, registerImports } from '../../db/schema.js'
import { CH_MAX_OFFSET, CH_PAGE_SIZE, segmentForSic } from './stock-sic'

const CH_API = 'https://api.company-information.service.gov.uk'
const CH_PUBLIC = 'https://find-and-update.company-information.service.gov.uk/company'

const chItemSchema = z.object({
  company_name: z.string(),
  company_number: z.string(),
  company_status: z.string().optional().default('unknown'),
  company_type: z.string().optional(),
  date_of_creation: z.string().optional(),
  sic_codes: z.array(z.string()).optional().default([]),
  registered_office_address: z
    .object({
      address_line_1: z.string().optional(),
      locality: z.string().optional(),
      region: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
    })
    .optional()
    .default({}),
})

const chResponseSchema = z.object({
  hits: z.number().optional().default(0),
  items: z.array(chItemSchema).optional().default([]),
})

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function chFetch(path: string, params: URLSearchParams) {
  const key = process.env.COMPANIES_HOUSE_API_KEY
  if (!key) throw new Error('Companies House is not connected. Add COMPANIES_HOUSE_API_KEY in Netlify.')
  const auth = `Basic ${Buffer.from(`${key}:`).toString('base64')}`
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(`${CH_API}${path}?${params}`, { headers: { Authorization: auth } })
    if (res.status === 429) {
      await sleep(1500 * (attempt + 1))
      continue
    }
    if (res.status === 404) return { hits: 0, items: [] }
    if (res.status === 401) throw new Error('Companies House rejected the API key. Check COMPANIES_HOUSE_API_KEY.')
    if (!res.ok) throw new Error(`Companies House returned ${res.status}. Try again shortly.`)
    return chResponseSchema.parse(await res.json())
  }
  throw new Error('Companies House rate limit reached. Wait a few minutes and resume the import.')
}

// ---------------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------------

export const getRegisterStatus = createServerFn({ method: 'GET' }).handler(async () => {
  const connected = {
    companiesHouse: Boolean(process.env.COMPANIES_HOUSE_API_KEY),
    hmrc: Boolean(process.env.HMRC_CLIENT_ID && process.env.HMRC_CLIENT_SECRET),
  }
  try {
    const [totals, segments, imports] = await Promise.all([
      db
        .select({
          total: count(),
          inPipeline: sql<number>`count(${registerCompanies.addedToPipelineAt})::int`,
          vatChecked: sql<number>`count(${registerCompanies.vatCheckedAt})::int`,
        })
        .from(registerCompanies),
      db
        .select({ segment: registerCompanies.stockSegment, n: count() })
        .from(registerCompanies)
        .groupBy(registerCompanies.stockSegment),
      db.select().from(registerImports).orderBy(desc(registerImports.createdAt)).limit(6),
    ])
    return {
      connected,
      databaseError: null as string | null,
      total: totals[0]?.total ?? 0,
      inPipeline: totals[0]?.inPipeline ?? 0,
      vatChecked: totals[0]?.vatChecked ?? 0,
      bySegment: Object.fromEntries(segments.map((s) => [s.segment ?? 'other', s.n])) as Record<string, number>,
      imports: imports.map((i) => ({ ...i, createdAt: i.createdAt.toISOString() })),
    }
  } catch (err) {
    console.error('register status failed', err)
    return {
      connected,
      databaseError: 'The database is not reachable yet. It is provisioned on the next deploy.',
      total: 0,
      inPipeline: 0,
      vatChecked: 0,
      bySegment: {} as Record<string, number>,
      imports: [],
    }
  }
})

// ---------------------------------------------------------------------------
// Import from Companies House
// ---------------------------------------------------------------------------

export const startRegisterImport = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      segment: z.string().max(40),
      location: z.string().max(80).optional(),
      requested: z.number().int().min(1).max(100_000),
    }),
  )
  .handler(async ({ data }) => {
    const [row] = await db
      .insert(registerImports)
      .values({ segment: data.segment, location: data.location || null, requested: data.requested })
      .returning({ id: registerImports.id })
    return { importId: row!.id }
  })

export const importRegisterBatch = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      importId: z.number().int(),
      sicCode: z.string().regex(/^\d{4,5}$/),
      location: z.string().max(80).optional(),
      startIndex: z.number().int().min(0).max(CH_MAX_OFFSET),
      size: z.number().int().min(1).max(CH_PAGE_SIZE),
    }),
  )
  .handler(async ({ data }) => {
    const params = new URLSearchParams({
      sic_codes: data.sicCode,
      company_status: 'active',
      size: String(data.size),
      start_index: String(data.startIndex),
    })
    if (data.location?.trim()) params.set('location', data.location.trim())
    const result = await chFetch('/advanced-search/companies', params)

    const now = new Date()
    const rows = result.items.map((c) => {
      const a = c.registered_office_address
      return {
        companyNumber: c.company_number,
        name: c.company_name,
        status: c.company_status,
        companyType: c.company_type ?? null,
        incorporatedOn: c.date_of_creation ?? null,
        sicCodes: c.sic_codes,
        stockSegment: segmentForSic(c.sic_codes.length ? c.sic_codes : [data.sicCode]),
        addressLine1: a.address_line_1 ?? null,
        locality: a.locality ?? null,
        region: a.region ?? null,
        postcode: a.postal_code?.toUpperCase() ?? null,
        country: a.country ?? null,
        sourceUrl: `${CH_PUBLIC}/${c.company_number}`,
        retrievedAt: now,
      }
    })

    let added = 0
    // De-duplicate within the page (the same company can appear twice).
    const unique = [...new Map(rows.map((r) => [r.companyNumber, r])).values()]
    for (let i = 0; i < unique.length; i += 500) {
      const chunk = unique.slice(i, i + 500)
      const res = await db
        .insert(registerCompanies)
        .values(chunk)
        .onConflictDoUpdate({
          target: registerCompanies.companyNumber,
          set: {
            name: sql`excluded.name`,
            status: sql`excluded.status`,
            companyType: sql`excluded.company_type`,
            sicCodes: sql`excluded.sic_codes`,
            addressLine1: sql`excluded.address_line_1`,
            locality: sql`excluded.locality`,
            region: sql`excluded.region`,
            postcode: sql`excluded.postcode`,
            country: sql`excluded.country`,
            retrievedAt: sql`excluded.retrieved_at`,
          },
        })
        .returning({ inserted: sql<boolean>`(xmax = 0)` })
      added += res.filter((r) => r.inserted).length
    }

    await db
      .update(registerImports)
      .set({
        fetched: sql`${registerImports.fetched} + ${result.items.length}`,
        added: sql`${registerImports.added} + ${added}`,
      })
      .where(eq(registerImports.id, data.importId))

    return { hits: result.hits, fetched: result.items.length, added }
  })

// ---------------------------------------------------------------------------
// Browse saved register companies
// ---------------------------------------------------------------------------

const listInput = z.object({
  q: z.string().max(120).optional(),
  segment: z.string().max(40).optional(),
  location: z.string().max(80).optional(),
  pipeline: z.enum(['any', 'not-added', 'added']).default('any'),
  sort: z.enum(['newest-company', 'oldest-company', 'name', 'recently-imported']).default('name'),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(200).default(50),
})

function listWhere(f: z.infer<typeof listInput>) {
  const where: SQL[] = []
  if (f.q?.trim()) {
    const q = `%${f.q.trim()}%`
    where.push(or(ilike(registerCompanies.name, q), ilike(registerCompanies.companyNumber, q))!)
  }
  if (f.segment && f.segment !== 'all') where.push(eq(registerCompanies.stockSegment, f.segment))
  if (f.location?.trim()) {
    const l = `%${f.location.trim()}%`
    where.push(
      or(
        ilike(registerCompanies.locality, l),
        ilike(registerCompanies.postcode, `${f.location.trim()}%`),
        ilike(registerCompanies.region, l),
        ilike(registerCompanies.addressLine1, l),
      )!,
    )
  }
  if (f.pipeline === 'not-added') where.push(isNull(registerCompanies.addedToPipelineAt))
  if (f.pipeline === 'added') where.push(sql`${registerCompanies.addedToPipelineAt} is not null`)
  return where.length ? and(...where) : undefined
}

const orderFor = (sort: z.infer<typeof listInput>['sort']) =>
  sort === 'newest-company'
    ? desc(registerCompanies.incorporatedOn)
    : sort === 'oldest-company'
      ? asc(registerCompanies.incorporatedOn)
      : sort === 'recently-imported'
        ? desc(registerCompanies.retrievedAt)
        : asc(registerCompanies.name)

const serialise = (r: typeof registerCompanies.$inferSelect) => ({
  ...r,
  retrievedAt: r.retrievedAt.toISOString(),
  vatCheckedAt: r.vatCheckedAt?.toISOString() ?? null,
  addedToPipelineAt: r.addedToPipelineAt?.toISOString() ?? null,
})

export type RegisterCompany = ReturnType<typeof serialise>

export const listRegisterCompanies = createServerFn({ method: 'GET' })
  .validator(listInput)
  .handler(async ({ data }) => {
    const where = listWhere(data)
    const [rows, totals] = await Promise.all([
      db
        .select()
        .from(registerCompanies)
        .where(where)
        .orderBy(orderFor(data.sort), asc(registerCompanies.companyNumber))
        .limit(data.pageSize)
        .offset((data.page - 1) * data.pageSize),
      db.select({ n: count() }).from(registerCompanies).where(where),
    ])
    return { rows: rows.map(serialise), total: totals[0]?.n ?? 0 }
  })

export const exportRegisterCompanies = createServerFn({ method: 'POST' })
  .validator(listInput.omit({ page: true, pageSize: true }))
  .handler(async ({ data }) => {
    const rows = await db
      .select()
      .from(registerCompanies)
      .where(listWhere({ ...data, page: 1, pageSize: 50 }))
      .orderBy(orderFor(data.sort))
      .limit(50_000)
    return rows.map(serialise)
  })

export const markAddedToPipeline = createServerFn({ method: 'POST' })
  .validator(z.object({ companyNumbers: z.array(z.string().max(12)).min(1).max(500) }))
  .handler(async ({ data }) => {
    await db
      .update(registerCompanies)
      .set({ addedToPipelineAt: new Date() })
      .where(inArray(registerCompanies.companyNumber, data.companyNumbers))
    return { ok: true }
  })

// ---------------------------------------------------------------------------
// HMRC VAT Check (api.service.hmrc.gov.uk, application-restricted)
// ---------------------------------------------------------------------------

let hmrcToken: { value: string; expiresAt: number } | null = null

async function getHmrcToken(base: string) {
  if (hmrcToken && hmrcToken.expiresAt > Date.now() + 60_000) return hmrcToken.value
  const id = process.env.HMRC_CLIENT_ID
  const secret = process.env.HMRC_CLIENT_SECRET
  if (!id || !secret) throw new Error('HMRC is not connected. Add HMRC_CLIENT_ID and HMRC_CLIENT_SECRET in Netlify.')
  const res = await fetch(`${base}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: 'client_credentials' }),
  })
  if (!res.ok) throw new Error(`HMRC sign-in failed (${res.status}). Check the HMRC application credentials.`)
  const json = z.object({ access_token: z.string(), expires_in: z.number() }).parse(await res.json())
  hmrcToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
  return hmrcToken.value
}

const vatResponseSchema = z.object({
  target: z.object({
    name: z.string(),
    vatNumber: z.string(),
    address: z
      .object({ line1: z.string().optional(), postcode: z.string().optional(), countryCode: z.string().optional() })
      .optional(),
  }),
  processingDate: z.string().optional(),
  consultationNumber: z.string().optional(),
})

export const checkVatNumber = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      vatNumber: z.string().transform((v) => v.replace(/^GB/i, '').replace(/\s+/g, '')).pipe(z.string().regex(/^\d{9}(\d{3})?$/, 'A UK VAT number has 9 digits')),
      companyNumber: z.string().max(12).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const base = process.env.HMRC_API_BASE || 'https://api.service.hmrc.gov.uk'
    const token = await getHmrcToken(base)
    const res = await fetch(`${base}/organisations/vat/check-vat-number/lookup/${data.vatNumber}`, {
      headers: { Accept: 'application/vnd.hmrc.2.0+json', Authorization: `Bearer ${token}` },
    })
    const checkedAt = new Date()
    if (res.status === 404) {
      return { found: false as const, vatNumber: data.vatNumber, checkedAt: checkedAt.toISOString() }
    }
    if (res.status === 429) throw new Error('HMRC rate limit reached. Try again in a minute.')
    if (!res.ok) throw new Error(`HMRC returned ${res.status}. Try again shortly.`)
    const json = vatResponseSchema.parse(await res.json())

    if (data.companyNumber) {
      await db
        .update(registerCompanies)
        .set({
          vatNumber: json.target.vatNumber,
          vatRegisteredName: json.target.name,
          vatCheckedAt: checkedAt,
          vatConsultationRef: json.consultationNumber ?? null,
        })
        .where(eq(registerCompanies.companyNumber, data.companyNumber))
    }
    return {
      found: true as const,
      vatNumber: json.target.vatNumber,
      name: json.target.name,
      address: [json.target.address?.line1, json.target.address?.postcode].filter(Boolean).join(', '),
      checkedAt: checkedAt.toISOString(),
    }
  })

