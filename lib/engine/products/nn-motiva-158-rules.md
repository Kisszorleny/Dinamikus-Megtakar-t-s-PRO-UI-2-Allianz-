# NN Motiva 158 - V1 implementation notes

## Implemented in V1
- Product identity and variant mapping:
  - HUF: NN Motiva 158 (`158`)
  - EUR: NN EUR Motiva 168 (`168`)
- Regular-premium sales cost curve by duration:
  - 10-year: 10% / 10% / 10% / 3% (from year 4),
  - 20+ year: 30% / 20% / 20% / 3% (from year 4),
  - 11-19 years: deterministic linear interpolation.
- Extraordinary payment sales cost: 6%.
- Monthly admin defaults:
  - standard: 1250 HUF/month,
  - annual-payment mode: 790 HUF/month,
  - paid-up: 940 HUF/month,
  - post-term: 320 HUF/month (prepared as resolver profile).
- Accident death rider fee default: 142 HUF/month.
- Asset-based fee profiles:
  - money market 1.25%,
  - bond 1.40%,
  - equity 1.70%,
  - target-date: remaining-years based banding.
- Tax credit enabled by default for pension behavior:
  - rate 20%,
  - annual cap 130 000 HUF (158) / 1 625 EUR (168),
  - separate tax-bonus account routing enabled.
- Full surrender schedule mapped to yearly redemption fee curve using month-point interpolation.
- Partial surrender disabled (`allowPartialSurrender=false`) and withdrawals disabled by default.
- 168-specific deltas in V1:
  - special cancellation fee constant: 40 EUR,
  - minimum extraordinary payment constant: 200 EUR,
  - EUR account/admin/risk defaults are enabled via variant-aware resolvers.

## Deferred to V2
- Dedicated UI selectors for payment method and asset profile (including target-date bucket selection).
- 9Q1 kiegészítő biztosítás teljes logikája (likvid tartalék, külön adójóváírás-jogosultság kezelés).
- Transaction-level unit switching cost modeling:
  - first 4 switch operations free each year,
  - then 2 per mille with min/max amount caps.
- Special cancellation (30-day) event-level handling, including medical exam fee cap.
- Fine-grained month-level surrender table integration if official monthly table is available.
- Explicit tax-credit repayment-on-surrender edge-case rules, if product terms require it.
