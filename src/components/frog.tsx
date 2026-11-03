import * as React from "react";
import { cn } from "@/lib/utils";

export type FrogMood = "smug" | "sad" | "happy" | "shook";

/**
 * Conneck's mascot: an original, hand-drawn meme-style frog.
 * Pure inline SVG so it scales from favicon-size to hero-size with no requests.
 */
export function Frog({
  mood = "smug",
  hoodie = false,
  className,
  title,
}: {
  mood?: FrogMood;
  hoodie?: boolean;
  className?: string;
  title?: string;
}) {
  const id = React.useId().replace(/:/g, "");
  const vb = hoodie ? "0 0 120 128" : "0 0 120 100";
  return (
    <svg
      viewBox={vb}
      className={cn("shrink-0 overflow-visible", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <defs>
        <clipPath id={`l${id}`}>
          <ellipse cx="38" cy="36" rx="13" ry="11" />
        </clipPath>
        <clipPath id={`r${id}`}>
          <ellipse cx="82" cy="36" rx="13" ry="11" />
        </clipPath>
      </defs>

      {hoodie && (
        <g>
          <path
            d="M10 128 C12 104 30 90 60 90 C90 90 108 104 110 128 Z"
            fill="var(--frog-hoodie)"
            stroke="var(--frog-ink)"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M44 92 L50 112 M76 92 L70 112"
            stroke="var(--frog-ink)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* head */}
      <ellipse
        cx="60"
        cy="62"
        rx="52"
        ry="32"
        fill="var(--frog-skin)"
        stroke="var(--frog-ink)"
        strokeWidth="3"
      />
      {/* eye domes */}
      <circle
        cx="38"
        cy="34"
        r="19"
        fill="var(--frog-skin)"
        stroke="var(--frog-ink)"
        strokeWidth="3"
      />
      <circle
        cx="82"
        cy="34"
        r="19"
        fill="var(--frog-skin)"
        stroke="var(--frog-ink)"
        strokeWidth="3"
      />
      {/* hide the dome outline where it meets the head */}
      <ellipse cx="60" cy="58" rx="46" ry="20" fill="var(--frog-skin)" />
      {/* cheek blush */}
      <ellipse
        cx="22"
        cy="68"
        rx="7"
        ry="4"
        fill="var(--frog-blush)"
        opacity=".55"
      />
      <ellipse
        cx="98"
        cy="68"
        rx="7"
        ry="4"
        fill="var(--frog-blush)"
        opacity=".55"
      />
      {/* nostrils */}
      <path
        d="M55 56 q1 -2 2 0 M63 56 q1 -2 2 0"
        stroke="var(--frog-ink)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {mood === "happy" ? (
        <g
          stroke="var(--frog-ink)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        >
          <path d="M28 40 Q38 28 48 40" />
          <path d="M72 40 Q82 28 92 40" />
        </g>
      ) : (
        <g>
          <ellipse
            cx="38"
            cy="36"
            rx="13"
            ry="11"
            fill="var(--frog-eye)"
            stroke="var(--frog-ink)"
            strokeWidth="2.5"
          />
          <ellipse
            cx="82"
            cy="36"
            rx="13"
            ry="11"
            fill="var(--frog-eye)"
            stroke="var(--frog-ink)"
            strokeWidth="2.5"
          />
          <Pupils mood={mood} />
          <Lids mood={mood} id={id} />
        </g>
      )}

      <Mouth mood={mood} />
      {mood === "sad" && (
        <path
          d="M27 46 q-4 8 0 11 q4 -3 0 -11 Z"
          fill="var(--frog-tear)"
          stroke="var(--frog-ink)"
          strokeWidth="1.5"
        />
      )}
    </svg>
  );
}

function Pupils({ mood }: { mood: FrogMood }) {
  if (mood === "shook")
    return (
      <g fill="var(--frog-ink)">
        <circle cx="38" cy="36" r="2.6" />
        <circle cx="82" cy="36" r="2.6" />
      </g>
    );
  // smug side-eye / sad downcast
  const dx = mood === "smug" ? 5 : 0;
  const dy = mood === "sad" ? 4 : 2;
  return (
    <g fill="var(--frog-ink)">
      <circle cx={38 + dx} cy={36 + dy} r="4.6" />
      <circle cx={82 + dx} cy={36 + dy} r="4.6" />
      <circle cx={39.5 + dx} cy={34.5 + dy} r="1.4" fill="var(--frog-eye)" />
      <circle cx={83.5 + dx} cy={34.5 + dy} r="1.4" fill="var(--frog-eye)" />
    </g>
  );
}

function Lids({ mood, id }: { mood: FrogMood; id: string }) {
  if (mood === "shook") return null;
  // Lid polygons are clipped to each eye, so only the slant needs describing.
  const left =
    mood === "smug" ? "M20 20 H56 V36 L20 37 Z" : "M20 20 H56 V28 L20 40 Z";
  const right =
    mood === "smug" ? "M64 20 H100 V37 L64 36 Z" : "M64 20 H100 V40 L64 28 Z";
  const leftLine = mood === "smug" ? "M24 37 L52 36" : "M24 39 L52 29";
  const rightLine = mood === "smug" ? "M68 36 L96 37" : "M68 29 L96 39";
  return (
    <g>
      <path d={left} fill="var(--frog-lid)" clipPath={`url(#l${id})`} />
      <path d={right} fill="var(--frog-lid)" clipPath={`url(#r${id})`} />
      <g stroke="var(--frog-ink)" strokeWidth="2.5" strokeLinecap="round">
        <path d={leftLine} clipPath={`url(#l${id})`} />
        <path d={rightLine} clipPath={`url(#r${id})`} />
      </g>
    </g>
  );
}

function Mouth({ mood }: { mood: FrogMood }) {
  const ink = "var(--frog-ink)";
  const lip = "var(--frog-lip)";
  switch (mood) {
    case "happy":
      return (
        <g>
          <path d="M28 66 Q60 96 92 66 Q60 76 28 66 Z" fill={ink} />
          <path
            d="M44 78 Q60 90 76 78 Q60 82 44 78 Z"
            fill="var(--frog-blush)"
          />
          <path
            d="M26 66 Q60 74 94 66"
            stroke={lip}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      );
    case "sad":
      return (
        <g fill="none" strokeLinecap="round">
          <path d="M30 78 Q60 62 90 78" stroke={lip} strokeWidth="6" />
          <path d="M32 78 Q60 66 88 78" stroke={ink} strokeWidth="1.5" />
        </g>
      );
    case "shook":
      return (
        <ellipse
          cx="60"
          cy="74"
          rx="8"
          ry="6"
          fill={ink}
          stroke={lip}
          strokeWidth="3"
        />
      );
    default:
      return (
        <g fill="none" strokeLinecap="round">
          <path d="M26 70 Q56 80 96 64" stroke={lip} strokeWidth="6.5" />
          <path d="M30 70 Q56 77 92 65" stroke={ink} strokeWidth="1.6" />
          <path d="M94 62 q4 1 3 5" stroke={ink} strokeWidth="2" />
        </g>
      );
  }
}

/** A comic speech bubble that points at the frog. */
export function SpeechBubble({
  children,
  className,
  tail = "left",
}: {
  children: React.ReactNode;
  className?: string;
  tail?: "left" | "bottom";
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border-2 border-ink bg-foreground px-3.5 py-2 font-display text-sm leading-snug text-background shadow-[3px_3px_0_var(--ink)]",
        "before:absolute before:size-4 before:rotate-45 before:border-b-2 before:border-ink before:bg-foreground before:content-['']",
        tail === "left"
          ? "before:-left-[9px] before:bottom-3 before:border-l-2"
          : "before:-bottom-[9px] before:left-6 before:border-r-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const FROG_QUIPS = [
  "Ribbit. Follow up with the warm ones first.",
  "A lead in the pond is worth two in the bog.",
  "Hop to it. Revenue doesn’t croak itself.",
  "No bulk spam. Frog’s honour.",
  "Verified facts only. I don’t do fake flies.",
  "Lily pad today, unicorn pond tomorrow.",
  "Be the frog you want to see in the pipeline.",
];
