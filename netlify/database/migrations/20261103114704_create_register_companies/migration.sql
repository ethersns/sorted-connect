CREATE TABLE "register_companies" (
	"company_number" text PRIMARY KEY,
	"name" text NOT NULL,
	"status" text NOT NULL,
	"company_type" text,
	"incorporated_on" text,
	"sic_codes" text[] DEFAULT '{}'::text[] NOT NULL,
	"stock_segment" text,
	"address_line_1" text,
	"locality" text,
	"region" text,
	"postcode" text,
	"country" text,
	"source_url" text NOT NULL,
	"retrieved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"vat_number" text,
	"vat_registered_name" text,
	"vat_checked_at" timestamp with time zone,
	"vat_consultation_ref" text,
	"added_to_pipeline_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "register_imports" (
	"id" serial PRIMARY KEY,
	"segment" text NOT NULL,
	"location" text,
	"requested" integer NOT NULL,
	"fetched" integer DEFAULT 0 NOT NULL,
	"added" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "register_companies_name_idx" ON "register_companies" ("name");--> statement-breakpoint
CREATE INDEX "register_companies_segment_idx" ON "register_companies" ("stock_segment");--> statement-breakpoint
CREATE INDEX "register_companies_postcode_idx" ON "register_companies" ("postcode");