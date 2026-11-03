import { CircleCheck, CircleHelp, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PIPELINES } from "@/lib/pipelines";
import type { Confidence, PipelineKind, Provenance } from "@/lib/types";
import { Frog } from "./frog";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-3xl text-foreground underline decoration-primary/70 decoration-wavy decoration-2 underline-offset-[10px] sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-reading text-sm font-medium text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export function ScoreRing({
  score,
  size = 44,
}: {
  score: number | null;
  size?: number;
}) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const pct = score ?? 0;
  const color =
    score == null
      ? "var(--muted-foreground)"
      : pct >= 75
        ? "var(--primary)"
        : pct >= 55
          ? "var(--warning)"
          : "var(--muted-foreground)";
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={
        score == null ? "Not assessed" : `Fit score ${score} out of 100`
      }
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={3}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          className="transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
        />
      </svg>
      <span className="tabular absolute inset-0 flex items-center justify-center font-mono text-[11px] font-medium text-foreground">
        {score ?? "—"}
      </span>
    </div>
  );
}

export function ConfidencePill({ confidence }: { confidence: Confidence }) {
  const tone =
    confidence === "High"
      ? "text-success bg-success/10 border-success/25"
      : confidence === "Medium"
        ? "text-warning bg-warning/10 border-warning/25"
        : "text-muted-foreground bg-muted border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold",
        tone,
      )}
    >
      {confidence} confidence
    </span>
  );
}

export function KindBadge({ kind }: { kind: PipelineKind }) {
  const p = PIPELINES[kind];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/70 px-2 py-0.5 text-[11px] font-bold text-secondary-foreground">
      <span
        className="size-1.5 rounded-full"
        style={{ background: p.colorVar }}
      />
      {p.short}
    </span>
  );
}

export function ProvenanceTag({ provenance }: { provenance: Provenance }) {
  if (provenance === "verified")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-success">
        <CircleCheck className="size-3" /> Verified
      </span>
    );
  if (provenance === "inferred")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-warning">
        <Sparkles className="size-3" /> AI inference
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <CircleHelp className="size-3" /> Not found
    </span>
  );
}

export function SourceLink({ url, label }: { url: string; label?: string }) {
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    /* keep raw */
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className="inline-flex max-w-full items-center gap-1 truncate text-xs text-primary hover:underline"
    >
      <ExternalLink className="size-3 shrink-0" />
      <span className="truncate">{label ?? host}</span>
    </a>
  );
}

export function SampleBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-warning/50 bg-warning/[0.07] px-4 py-3 text-sm">
      <Frog mood="shook" className="w-10" />
      <div className="text-foreground/85">
        <span className="mr-1 font-display tracking-wide text-warning">
          Heads up, tadpole.
        </span>
        {children}
      </div>
    </div>
  );
}

export function SampleTag() {
  return (
    <span className="rounded border border-warning/40 bg-warning/15 px-1.5 py-px text-[10px] font-bold uppercase tracking-wider text-warning">
      Sample
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border px-6 py-12 text-center">
      <div className="relative mb-3">
        <Frog mood="sad" className="frog-bob w-20" />
        <span className="absolute -right-3 -top-1 flex size-7 items-center justify-center rounded-full border-2 border-ink bg-secondary">
          <Icon className="size-3.5 text-muted-foreground" />
        </span>
      </div>
      <p className="font-display text-lg tracking-wide">{title}</p>
      {children && (
        <div className="mt-1 max-w-sm text-sm text-muted-foreground">
          {children}
        </div>
      )}
    </div>
  );
}

export const formatGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
