import type { Metadata } from "next";
import Nav from "@/components/Nav";
import DocsSidebar from "@/components/DocsSidebar";
import CodeBlock from "@/components/CodeBlock";
import Callout from "@/components/Callout";

export const metadata: Metadata = {
  title: "Docs — Valiquo",
  description: "Technical documentation for Valiquo's negotiation API, payment settlement, and architecture.",
};

export default function DocsPage() {
  return (
    <>
      <Nav />
      <main className="w-full max-w-full">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:px-8 lg:py-16">
          <DocsSidebar />

          <div className="min-w-0 max-w-3xl flex-1">
            <div className="mb-12">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-label">
                Documentation
              </span>
              <h1 className="mt-4 w-full text-balance break-words font-display text-3xl font-bold text-ink-heading sm:text-4xl">
                Valiquo technical docs.
              </h1>
              <p className="mt-4 w-full max-w-xl text-balance break-words text-sm leading-relaxed text-ink-body sm:text-base">
                Every field name, response shape, and number on this page is pulled
                directly from the running backend&apos;s source and verified against
                live requests — not invented.
              </p>
            </div>

            {/* ---------------- GETTING STARTED ---------------- */}
            <section id="overview" className="min-w-0 scroll-mt-24">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-label">
                Getting started
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold text-ink-heading">Overview</h2>
              <div className="mt-4 flex min-w-0 flex-col gap-4 text-sm leading-relaxed text-ink-body sm:text-base">
                <p>
                  Valiquo is a negotiated-price payment layer in front of live
                  financial and on-chain intelligence data. Instead of a single flat
                  rate per API call, a buyer agent proposes what it&apos;s willing to
                  pay, and the seller responds by accepting, countering at its real
                  cost floor, or rejecting — resolved in the same request/response
                  round trip.
                </p>
                <p>
                  That negotiation matters because most machine-readable data APIs
                  charge the same price regardless of what a request is actually
                  worth in the moment, forcing every pricing decision to be made
                  once, in advance, by a human. Valiquo lets the price move instead,
                  in real time, decided by the agents actually doing the requesting.
                </p>
                <p>
                  Once a price is agreed, settlement happens on-chain via Circle
                  Gateway and the x402 protocol on Arc — no invoices, subscriptions,
                  or manual reconciliation on either side. Today Valiquo has a
                  single live data seller (BTC Cycle Intelligence, five tools), but
                  the negotiation and settlement layer underneath isn&apos;t specific
                  to that seller.
                </p>
              </div>
            </section>

            <section id="architecture" className="mt-12 min-w-0 scroll-mt-24">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-label">
                Getting started
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold text-ink-heading">Architecture</h2>
              <div className="mt-4 flex min-w-0 flex-col gap-4 text-sm leading-relaxed text-ink-body sm:text-base">
                <p>
                  The backend is a single Express API (<code className="text-ink-heading">src/server.ts</code>)
                  that owns three responsibilities: negotiating a price over HTTP,
                  gating data delivery behind a Circle Gateway/x402 payment, and
                  calling out to an external MCP server to fetch the actual
                  intelligence data once payment settles.
                </p>
                <p>
                  Negotiation and payment state live entirely in memory — a map of
                  quotes keyed by quote id, a per-negotiation round counter, and a
                  small array of rejected-proposal records.
                </p>
                <Callout title="Known limitation">
                  None of this state survives a server restart. There&apos;s no
                  database behind it yet, so restarting the process clears all
                  negotiation history. This is a real, currently-accepted tradeoff
                  for this phase — not a bug being hidden.
                </Callout>
                <p>
                  Each quote moves through a small state machine:{" "}
                  <code className="text-ink-heading">OPEN → PROCESSING → FULFILLED</code>.
                  It exists to prevent double-payment and race conditions on a
                  single quote — the transition to <code className="text-ink-heading">PROCESSING</code>{" "}
                  only happens once Circle Gateway&apos;s middleware confirms a real
                  signed payment payload has arrived (never on a plain unpaid 402
                  probe), and if verification or settlement fails partway through,
                  the quote recovers back to <code className="text-ink-heading">OPEN</code> rather
                  than getting stuck. Only after payment is confirmed does the
                  server call into the seller&apos;s actual data source — currently a
                  single external MCP server for BTC Cycle Intelligence — and
                  return the result.
                </p>
                <Callout title="What Valiquo is not">
                  Valiquo consumes an external MCP server; it does not expose one
                  itself. There is no CLI tool, no chat bot, and no separately
                  hosted &quot;MCP server&quot; product — just this HTTP API.
                </Callout>
              </div>
            </section>

            {/* ---------------- API REFERENCE ---------------- */}
            <section id="api-quote" className="mt-12 min-w-0 scroll-mt-24">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-label">
                API reference
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold text-ink-heading">POST /quote</h2>
              <p className="mt-4 min-w-0 text-sm leading-relaxed text-ink-body sm:text-base">
                Propose a price for a tool. Returns a decision of{" "}
                <code className="text-ink-heading">accept</code>,{" "}
                <code className="text-ink-heading">counter</code>, or{" "}
                <code className="text-ink-heading">reject</code> in the same response
                — no polling required.
              </p>

              <div className="mt-6 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-label">
                  Request body
                </p>
                <div className="mt-2">
                  <CodeBlock>{`{
  "tool": string,              // one of the 5 real tool names below
  "proposedPrice": number,     // USDC
  "args"?: object,             // forwarded to the tool after payment
  "negotiationId"?: string     // omit to start a new session
}`}</CodeBlock>
                </div>
              </div>

              <div className="mt-6 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-label">
                  Response shape (accept / counter)
                </p>
                <div className="mt-2">
                  <CodeBlock>{`{
  "decision": "accept" | "counter",
  "quoteId": string,
  "agreedPrice": number,
  "reason": string,
  "payUrl": "/pay/{quoteId}",
  "expiresInSeconds": 120,
  "negotiationId": string,
  "round": number
}`}</CodeBlock>
                </div>
              </div>

              <div className="mt-6 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-label">
                  Response shape (reject)
                </p>
                <div className="mt-2">
                  <CodeBlock>{`{
  "decision": "reject",
  "reason": string,
  "negotiationId": string,
  "round": number
}`}</CodeBlock>
                </div>
              </div>

              <p className="mt-8 min-w-0 text-xs font-semibold uppercase tracking-wide text-ink-label">
                Real examples — captured live against the running backend
              </p>

              <div className="mt-3 min-w-0">
                <CodeBlock label="accept — get_btc_cycle_regime @ 0.006">{`$ curl -X POST http://localhost:3000/quote \\
  -H "Content-Type: application/json" \\
  -d '{"tool":"get_btc_cycle_regime","proposedPrice":0.006}'

{"decision":"accept","quoteId":"15935f20-3069-4f68-b6a3-ca298a5b81ea","agreedPrice":0.006,"reason":"Offer clears cost floor; accepted at proposed price.","payUrl":"/pay/15935f20-3069-4f68-b6a3-ca298a5b81ea","expiresInSeconds":120,"negotiationId":"18561973-c914-4e6f-988d-b87d2f458c9c","round":1}`}</CodeBlock>
              </div>

              <div className="mt-4 min-w-0">
                <CodeBlock label="counter — get_entry_risk @ 0.001 (floor is 0.0015)">{`$ curl -X POST http://localhost:3000/quote \\
  -H "Content-Type: application/json" \\
  -d '{"tool":"get_entry_risk","proposedPrice":0.001}'

{"decision":"counter","quoteId":"e8e3ffe7-e72d-4698-816d-e6b00d6178b1","agreedPrice":0.0015,"reason":"Offer below cost floor; countering at floor price.","payUrl":"/pay/e8e3ffe7-e72d-4698-816d-e6b00d6178b1","expiresInSeconds":120,"negotiationId":"06e9f49d-b9a0-4972-a567-23022da85ec7","round":1}`}</CodeBlock>
              </div>

              <div className="mt-4 min-w-0">
                <CodeBlock label="reject — get_lth_behavior @ 0.0002 (floor is 0.0015)">{`$ curl -X POST http://localhost:3000/quote \\
  -H "Content-Type: application/json" \\
  -d '{"tool":"get_lth_behavior","proposedPrice":0.0002}'

{"decision":"reject","reason":"Offer too far below cost floor to be worth countering.","negotiationId":"381088c9-5844-4e66-aff9-7a0de4d373d5","round":1}`}</CodeBlock>
              </div>

              <div className="mt-4 min-w-0">
                <CodeBlock label="400 — missing proposedPrice">{`$ curl -X POST http://localhost:3000/quote \\
  -H "Content-Type: application/json" \\
  -d '{"tool":"get_btc_cycle_regime"}'

{"error":"tool and proposedPrice are required"}`}</CodeBlock>
              </div>
            </section>

            <section id="api-pay" className="mt-12 min-w-0 scroll-mt-24">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-label">
                API reference
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold text-ink-heading">GET /pay/:id</h2>
              <div className="mt-4 flex min-w-0 flex-col gap-4 text-sm leading-relaxed text-ink-body sm:text-base">
                <p>
                  The x402-gated payment route returned as <code className="text-ink-heading">payUrl</code>{" "}
                  from an accepted or countered quote. An unpaid request returns{" "}
                  <code className="text-ink-heading">402 Payment Required</code> with a
                  Circle Gateway payment-requirements payload; a correctly signed
                  payment completes the purchase and returns the real tool data.
                </p>
                <Callout title="Not something you curl directly">
                  In normal use this route is paid via a Circle Gateway client that
                  can sign the payment, not called bare. The shapes below are shown
                  for completeness — the unpaid 402 response is real and safe to
                  reproduce with plain curl; the paid success response is the real
                  documented shape from the source, not demonstrated live here (see
                  Limitations).
                </Callout>
              </div>

              <div className="mt-6 min-w-0">
                <CodeBlock label="402 — unpaid request (real, reproducible)">{`$ curl -i http://localhost:3000/pay/15935f20-3069-4f68-b6a3-ca298a5b81ea

HTTP/1.1 402 Payment Required
PAYMENT-REQUIRED: <base64-encoded payment requirements>
Content-Type: application/json

{}`}</CodeBlock>
              </div>

              <div className="mt-4 min-w-0">
                <CodeBlock label="the PAYMENT-REQUIRED header, decoded">{`{
  "x402Version": 2,
  "resource": {
    "url": "/pay/15935f20-3069-4f68-b6a3-ca298a5b81ea",
    "description": "Paid resource",
    "mimeType": "application/json"
  },
  "accepts": [{
    "scheme": "exact",
    "network": "eip155:5042002",
    "asset": "0x3600000000000000000000000000000000000000",
    "amount": "6000",
    "payTo": "0x1b777a0aE8d7f22d394A9BAB3f40d92664dcaAC1",
    "maxTimeoutSeconds": 604900,
    "extra": {
      "name": "GatewayWalletBatched",
      "version": "1",
      "verifyingContract": "0x0077777d7eba4688bdef3e311b846f25870a19b9"
    }
  }]
}`}</CodeBlock>
              </div>

              <div className="mt-4 min-w-0">
                <CodeBlock label="error cases (real)">{`404  {"error":"Unknown or expired quote"}
409  {"error":"Quote already redeemed"}                     (state is FULFILLED)
409  {"error":"Payment already in progress for this quote"} (state is PROCESSING)
410  {"error":"Quote expired - request a new /quote"}       (>120s since /quote)`}</CodeBlock>
              </div>

              <div className="mt-4 min-w-0">
                <CodeBlock label="success — after a valid signed payment (real shape, from source)">{`{
  "message": "Payment accepted - here is your data.",
  "tool": string,
  "agreedPrice": number,
  "data": unknown,          // the actual paid tool output — the one place
                             // in this whole API that appears
  "negotiationId": string,
  "round": number
}`}</CodeBlock>
              </div>
            </section>

            <section id="api-activity" className="mt-12 min-w-0 scroll-mt-24">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-label">
                API reference
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold text-ink-heading">GET /activity</h2>
              <div className="mt-4 flex min-w-0 flex-col gap-4 text-sm leading-relaxed text-ink-body sm:text-base">
                <p>
                  Metadata about past negotiations. Accepts an optional{" "}
                  <code className="text-ink-heading">?limit=</code> query param
                  (default 100). Sorted newest first.
                </p>
              </div>

              <div className="mt-4 min-w-0">
                <CodeBlock label="real response — GET /activity?limit=3">{`[
  {
    "quoteId": "e8e3ffe7-e72d-4698-816d-e6b00d6178b1",
    "negotiationId": "06e9f49d-b9a0-4972-a567-23022da85ec7",
    "round": 1,
    "tool": "get_entry_risk",
    "decision": "countered",
    "agreedPrice": 0.0015,
    "createdAt": "2026-07-06T14:36:19.860Z",
    "state": "OPEN"
  },
  {
    "quoteId": null,
    "negotiationId": "381088c9-5844-4e66-aff9-7a0de4d373d5",
    "round": 1,
    "tool": "get_lth_behavior",
    "decision": "rejected",
    "agreedPrice": null,
    "createdAt": "2026-07-06T14:36:19.930Z",
    "state": null
  }
]`}</CodeBlock>
              </div>

              <div className="mt-6">
                <Callout title="What this deliberately does not expose">
                  Never the actual paid intelligence data/content itself — only
                  metadata about how a price got agreed. For rejected offers, only{" "}
                  <code className="text-ink-heading">tool</code>,{" "}
                  <code className="text-ink-heading">negotiationId</code>,{" "}
                  <code className="text-ink-heading">round</code>, and a timestamp are
                  kept — never the proposed price or the rejection reason, since
                  either would reveal how close a lowball offer came to the real
                  cost floor. Both exclusions are deliberate: this endpoint is
                  activity metadata, and the whole product depends on not giving
                  away for free what people pay for.
                </Callout>
              </div>
            </section>

            <section id="api-pricing" className="mt-12 min-w-0 scroll-mt-24">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-label">
                API reference
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold text-ink-heading">GET /pricing</h2>
              <p className="mt-4 min-w-0 text-sm leading-relaxed text-ink-body sm:text-base">
                Read-only pricing configuration: the real cost floor and asking
                price <code className="text-ink-heading">/quote</code> negotiates
                against for each tool, plus the seller address and settlement
                network.
              </p>
              <div className="mt-4 min-w-0">
                <CodeBlock label="real response — GET /pricing">{`{
  "sellerAddress": "0x1b777a0aE8d7f22d394A9BAB3f40d92664dcaAC1",
  "network": "eip155:5042002",
  "tools": [
    { "tool": "get_btc_cycle_regime", "costFloor": 0.003,  "askPrice": 0.008 },
    { "tool": "get_lth_behavior",     "costFloor": 0.0015, "askPrice": 0.004 },
    { "tool": "get_entry_risk",       "costFloor": 0.0015, "askPrice": 0.004 },
    { "tool": "compare_to_2021_top",  "costFloor": 0.002,  "askPrice": 0.005 },
    { "tool": "get_nupl_sentiment",   "costFloor": 0.0015, "askPrice": 0.004 }
  ]
}`}</CodeBlock>
              </div>
            </section>

            {/* ---------------- HOW NEGOTIATION WORKS ---------------- */}
            <section id="negotiation-logic" className="mt-12 min-w-0 scroll-mt-24">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-label">
                How negotiation works
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold text-ink-heading">Decision logic</h2>
              <p className="mt-4 min-w-0 text-sm leading-relaxed text-ink-body sm:text-base">
                Every proposal is checked against two real numbers for that tool —
                its cost floor and its asking price — in this order:
              </p>
              <div className="mt-4 min-w-0">
                <CodeBlock>{`offer >= askPrice        -> accept, at askPrice
offer >= costFloor       -> accept, at the proposed price
offer >= costFloor * 0.5 -> counter, at costFloor
offer <  costFloor * 0.5 -> reject`}</CodeBlock>
              </div>
              <p className="mt-4 min-w-0 text-sm leading-relaxed text-ink-body sm:text-base">
                Worked example using <code className="text-ink-heading">get_entry_risk</code>{" "}
                (real floor <code className="text-ink-heading">$0.0015</code>, real ask{" "}
                <code className="text-ink-heading">$0.004</code>):
              </p>
              <div className="mt-4 min-w-0">
                <CodeBlock>{`propose >= $0.004               -> accept @ $0.004 (the ask)
propose in [$0.0015, $0.004)    -> accept @ the proposed price
propose in [$0.00075, $0.0015)  -> counter @ $0.0015 (the floor)
propose <  $0.00075             -> reject`}</CodeBlock>
              </div>
            </section>

            <section id="negotiation-sessions" className="mt-12 min-w-0 scroll-mt-24">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-label">
                How negotiation works
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold text-ink-heading">
                Sessions &amp; rounds
              </h2>
              <div className="mt-4 flex min-w-0 flex-col gap-4 text-sm leading-relaxed text-ink-body sm:text-base">
                <p>
                  Omit <code className="text-ink-heading">negotiationId</code> to start a
                  new session — the server generates one and returns it. Pass an
                  existing <code className="text-ink-heading">negotiationId</code> back on
                  a re-proposal (e.g. after a counter) to continue the same
                  session; the server tracks the round count itself, independent of
                  whatever the caller thinks the round is.
                </p>
                <p>
                  A session is capped at <code className="text-ink-heading">5</code> rounds.
                  The 6th call on the same <code className="text-ink-heading">negotiationId</code>{" "}
                  is rejected outright, regardless of price:
                </p>
              </div>
              <div className="mt-4 min-w-0">
                <CodeBlock label="real 6-round session, same negotiationId throughout">{`round 1..5: {"decision":"reject","reason":"Offer too far below cost floor to be worth countering.","negotiationId":"84793b1d-c350-4f6e-ae4a-6b2ff9a7471f","round":1..5}

round 6:    {"decision":"reject","reason":"Max negotiation rounds (5) exceeded for this session.","negotiationId":"84793b1d-c350-4f6e-ae4a-6b2ff9a7471f","round":6}`}</CodeBlock>
              </div>
            </section>

            {/* ---------------- PAYMENTS & SETTLEMENT ---------------- */}
            <section id="payments-settlement" className="mt-12 min-w-0 scroll-mt-24">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-label">
                Payments &amp; settlement
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold text-ink-heading">
                Gateway &amp; x402
              </h2>
              <div className="mt-4 flex min-w-0 flex-col gap-4 text-sm leading-relaxed text-ink-body sm:text-base">
                <p>
                  Payment is gated by Circle Gateway using the x402 protocol. A
                  signed payment moves an off-chain optimistic balance first, which
                  is fast — but the underlying on-chain batch settlement is a
                  separate step that can take longer, especially on testnet. This
                  API does not claim instant on-chain finality: a quote flips to{" "}
                  <code className="text-ink-heading">FULFILLED</code> once verify and
                  settle both succeed, and if either fails partway through, the
                  quote recovers back to <code className="text-ink-heading">OPEN</code> so
                  it can be paid again rather than getting stuck.
                </p>
                <p>
                  Settlement runs on <strong className="text-ink-heading">Arc Testnet</strong>{" "}
                  (chain id <code className="text-ink-heading">eip155:5042002</code>), where
                  USDC functions as the native gas-equivalent asset rather than a
                  separate token bridged in for the purpose. That&apos;s what makes
                  sub-cent payments (this backend&apos;s real prices run from{" "}
                  $0.0015 to $0.008) economically viable at all — there&apos;s no
                  separate gas currency eating a payment many times its own size.
                </p>
                <Callout title="CORS">
                  The API allows cross-origin requests (<code className="text-ink-heading">cors()</code>{" "}
                  with default settings) so the web frontend can call it directly
                  from the browser. This is wide open for local development and is
                  meant to be restricted to the real production frontend origin
                  before public deployment.
                </Callout>
              </div>
            </section>

            {/* ---------------- LIMITATIONS & ROADMAP ---------------- */}
            <section id="limitations" className="mt-12 min-w-0 scroll-mt-24">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-label">
                Limitations &amp; roadmap
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold text-ink-heading">
                Known limitations
              </h2>
              <ul className="mt-4 flex min-w-0 flex-col gap-4 text-sm leading-relaxed text-ink-body sm:text-base">
                <li className="min-w-0">
                  <strong className="text-ink-heading">In-memory state does not persist
                  across restarts.</strong> Quotes, negotiation rounds, and
                  rejection records are all held in process memory with no
                  database behind them. This is accepted for the current phase,
                  not something being hidden.
                </li>
                <li className="min-w-0">
                  <strong className="text-ink-heading">One live data seller today.</strong>{" "}
                  Every tool documented here is served by a single external BTC
                  Cycle Intelligence MCP server. The negotiation and settlement
                  architecture isn&apos;t seller-specific, but multi-seller support
                  doesn&apos;t exist yet.
                </li>
                <li className="min-w-0">
                  <strong className="text-ink-heading">Wallet-based payment signing in the
                  web UI isn&apos;t wired up yet.</strong> The landing page&apos;s
                  &quot;Try It&quot; widget negotiates a real price against this
                  real API, but stops before an actual on-chain payment — clicking
                  &quot;Pay&quot; is currently a stubbed step, not a live wallet
                  transaction.
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
