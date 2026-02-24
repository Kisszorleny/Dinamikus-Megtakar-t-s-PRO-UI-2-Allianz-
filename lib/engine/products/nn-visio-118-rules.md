# NN Visio 118 - V1 implementation notes

## Implemented in V1
- Product identity and HUF-only variant mapping.
- Duration range: 10-45 years.
- Minimum regular premium by duration:
  - 10-14 years: 23 800 HUF/month,
  - 15-45 years: 15 000 HUF/month.
- Minimum extraordinary payment: 50 000 HUF.
- Regular premium sales cost:
  - year 1: 10%-30% by duration,
  - years 2-3: 5%-15% by duration,
  - year 4+: 4%.
- High-premium handling above 2 000 000 HUF yearly investment part with weighted effective rate.
- Extraordinary payment sales cost (paid vs paid-up profile).
- Admin monthly fee resolver by payment frequency and method + paid-up default.
- Asset-based cost resolver:
  - standard categories (1.25/1.40/1.50/1.70/1.82),
  - target-date bucket logic (1.70/1.55/1.40 by remaining years).
- Surrender payout interpolation from month-level points mapped to yearly redemption fee defaults.
- Partial surrender fee approximation:
  - 3 per mille,
  - min 1 020 HUF,
  - max 8 470 HUF.
- V1 product-level behavior:
  - risk insurance disabled (`riskInsuranceEnabled=false`, fee `0`),
  - tax credit disabled,
  - bonus mode disabled.

## Deferred to V2
- Full monthly surrender table implementation for all documented month bands and payment frequencies.
- Transaction-level switching and redirection fees:
  - first 4 free online switches/year,
  - then min/max capped fee logic by channel (portal vs paper/fax).
- Plus unit 100% redemption modeled as separate event-level behavior in all scenarios.
- Special cancellation (30-day) detailed event model with medical exam fee cap handling.
- Full risk fee schedule with age and sum-at-risk based dynamics.
- Full admin misc fees (frequency/mode change, policy duplicate) as event-level charges.
