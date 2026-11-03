import { index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

/**
 * Companies pulled from the official UK registers (Companies House, with optional
 * HMRC VAT verification). Every row is real public-register data with its source
 * URL and retrieval time. Nothing here is fabricated or sample data.
 */
export const registerCompanies = pgTable(
  'register_companies',
  {
    companyNumber: text('company_number').primaryKey(),
    name: text().notNull(),
    status: text().notNull(),
    companyType: text('company_type'),
    incorporatedOn: text('incorporated_on'),
    sicCodes: text('sic_codes').array().notNull().default([]),
    stockSegment: text('stock_segment'),
    addressLine1: text('address_line_1'),
    locality: text(),
    region: text(),
    postcode: text(),
    country: text(),
    sourceUrl: text('source_url').notNull(),
    retrievedAt: timestamp('retrieved_at', { withTimezone: true }).notNull().defaultNow(),
    vatNumber: text('vat_number'),
    vatRegisteredName: text('vat_registered_name'),
    vatCheckedAt: timestamp('vat_checked_at', { withTimezone: true }),
    vatConsultationRef: text('vat_consultation_ref'),
    addedToPipelineAt: timestamp('added_to_pipeline_at', { withTimezone: true }),
  },
  (t) => [
    index('register_companies_name_idx').on(t.name),
    index('register_companies_segment_idx').on(t.stockSegment),
    index('register_companies_postcode_idx').on(t.postcode),
  ],
)

/** One row per import run, so the founder can see what was pulled and when. */
export const registerImports = pgTable('register_imports', {
  id: serial().primaryKey(),
  segment: text().notNull(),
  location: text(),
  requested: integer().notNull(),
  fetched: integer().notNull().default(0),
  added: integer().notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
