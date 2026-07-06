const ACTIVITY_API_URL = process.env.QUOTE_API_URL ?? "http://localhost:3000";

const TOOL_LABELS: Record<string, string> = {
  get_btc_cycle_regime: "BTC Cycle Regime",
  get_entry_risk: "Entry Risk",
  get_lth_behavior: "LTH Behavior",
  compare_to_2021_top: "Compare to 2021 Top",
  get_nupl_sentiment: "NUPL Sentiment",
};

interface ActivityRecord {
  quoteId: string | null;
  negotiationId: string;
  round: number;
  tool: string;
  decision: "accepted" | "countered" | "rejected";
  agreedPrice: number | null;
  createdAt: string;
  state: "OPEN" | "PROCESSING" | "FULFILLED" | null;
}

// Server-side fetch (runs on the Next.js server, not in the browser) so this
// isn't subject to the real backend's missing CORS headers the way a
// client-side fetch would be. cache: "no-store" keeps this live on every
// request rather than baking a snapshot in at build time.
async function getActivity(): Promise<ActivityRecord[]> {
  try {
    const res = await fetch(`${ACTIVITY_API_URL}/activity?limit=20`, { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as ActivityRecord[];
  } catch {
    return [];
  }
}

export default async function ProofSection() {
  const activity = await getActivity();

  // Prioritize a genuinely FULFILLED (paid + delivered) record; fall back to
  // the most recent accepted-but-unpaid one. /activity is already sorted
  // newest-first, so .find() gives the most recent match in each case.
  const fulfilled = activity.find((a) => a.state === "FULFILLED");
  const accepted = activity.find((a) => a.decision === "accepted");
  const record = fulfilled ?? accepted;
  const isFulfilled = record?.state === "FULFILLED";

  return (
    <section className="relative w-full overflow-hidden border-t border-subtle px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-label">
          Proof, not promises
        </span>
        <h2 className="mt-4 w-full text-balance break-words font-display text-2xl font-bold text-ink-heading sm:text-3xl">
          A real negotiation, pulled live from the backend.
        </h2>
        <p className="mt-3 w-full max-w-xl text-balance break-words text-sm leading-relaxed text-ink-body sm:text-base">
          This card is rendered from a live <code>GET /activity</code> call
          against the running Valiquo server — not marketing art.
        </p>

        <div className="mt-10 w-full max-w-sm min-w-0">
          {record ? (
            <div className="w-full min-w-0 rounded-2xl border border-[rgba(139,124,246,0.28)] bg-surface-gradient p-6 text-left shadow-glow">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="min-w-0 truncate text-xs font-semibold tracking-wide text-ink-label">
                  Deal Completed
                </span>
              </div>

              <h3 className="mt-4 min-w-0 truncate font-display text-lg font-bold text-ink-heading">
                {TOOL_LABELS[record.tool] ?? record.tool}
              </h3>
              <p className="mt-1 min-w-0 truncate text-xs text-ink-label">
                Provider: BTC Cycle Intelligence
              </p>

              <p className="mt-4 min-w-0 break-words font-display text-3xl font-bold text-ink-heading">
                ${record.agreedPrice} <span className="text-base font-medium text-ink-body">USDC</span>
              </p>

              <div className="mt-6 flex min-w-0 items-center gap-2 border-t border-subtle pt-4">
                <span className="h-2 w-2 shrink-0 rounded-full bg-success" />
                <span className="min-w-0 truncate text-xs font-bold uppercase tracking-wide text-success">
                  {isFulfilled ? "Intelligence Delivered" : "Negotiation Settled"}
                </span>
              </div>

              <p className="mt-3 min-w-0 truncate text-[11px] text-ink-label">
                Negotiation {record.negotiationId.slice(0, 8)}… ·{" "}
                {new Date(record.createdAt).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="w-full min-w-0 rounded-2xl border border-subtle bg-surface-gradient p-6 text-center text-sm text-ink-body">
              No settled negotiations yet — try the live demo below to create one.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
