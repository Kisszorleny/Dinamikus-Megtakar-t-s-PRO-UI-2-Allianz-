# NN Vista 128 - V1 implementation notes

## Implemented in V1
- Product identity and EUR-only variant mapping (`nn-vista-128`, code `128`).
- Duration range: 10-30 years.
- Minimum regular premium by duration:
  - 10-14 years: 114 EUR/month,
  - 15-30 years: 82 EUR/month.
- Minimum extraordinary payment: 500 EUR.
- Regular premium sales cost:
  - years 1-3: duration-based (10-19 years -> 10%-19%, 20-30 years -> 20%),
  - year 4+: 3%.
- Extraordinary payment sales cost resolver for paid vs paid-up contract profile.
- Admin monthly fee defaults by payment frequency, plus paid-up and post-term defaults.
- Risk monthly fee defaults by entry-age bucket:
  - 16-65: 0.71 EUR,
  - 66-80: 0.85 EUR.
- Asset-based cost resolver:
  - standard categories (0.45/1.40/1.55/1.70),
  - simplified target-date logic (1.70/1.55/1.40 by remaining years).
- Surrender yearly fee defaults from interpolated month-level key points (0h, 24h, 36h, 60h, 120h, maturity).
- Partial surrender fee approximation for plus-unit direction:
  - 0.3%,
  - min 4.40 EUR,
  - max 30.20 EUR.
- V1 product-level behavior:
  - tax credit disabled,
  - bonus mode disabled,
  - partial surrender remains enabled.

## Deferred to V2
- Full damage-free bonus logic with 10/20/30-year eligibility and posting events.
- Full month-level surrender tables and frequency-dependent payout differences.
- Transaction-level switch/redirection fees with free-tier and min/max caps.
- Detailed handling for payment-method specifics and HUF->EUR conversion edge cases.
- Full contractual separation of plus-unit vs accumulation-unit partial surrender behavior.
