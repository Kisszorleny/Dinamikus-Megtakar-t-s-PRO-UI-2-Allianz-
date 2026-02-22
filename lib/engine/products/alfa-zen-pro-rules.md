# Alfa Zen Pro (NY-08) rule notes

This file documents NY-08 rules and the strict feature-flagged gaps that must stay explicit until insurer tariff details are finalized.
It now also covers NY-14 (EUR) and NY-24 (USD), implemented as variants under the same `alfa-zen-pro` product.

## Implemented strict flags

- `ZEN_PRO_STRICT_UNSPECIFIED_RULES=true`
- `ZEN_PRO_ENABLE_BONUS_PAUSE_MULTIPLIER=false`
- `ZEN_PRO_ENABLE_POLICY_ISSUANCE_CANCELLATION_FEE=false`

## Flagged TODO rules

1. Bonus pause multipliers
   - Current: disabled by default (`ZEN_PRO_ENABLE_BONUS_PAUSE_MULTIPLIER=false`).
   - TODO: replace with the official month->multiplier table from NY-08 annex.

2. Policy issuance cancellation fee (14 000 Ft in 30-day cancellation window)
   - Current: disabled by default (`ZEN_PRO_ENABLE_POLICY_ISSUANCE_CANCELLATION_FEE=false`).
   - TODO: wire to a dedicated cancellation event/state instead of productVariant encoding.

3. Redemption fee exact year-1 handling
   - Current: year 1 uses the same 3.5% rate as year 2 to avoid a silent zero-cost default.
   - TODO: confirm the insurer's explicit first-year surrender handling and update the schedule accordingly.

4. NY-14 tax credit cap conversion
   - Current: NY-14 uses `130000 HUF / EURHUF`, with fallback `EURHUF=400` when no rate is available.
   - TODO: confirm official fallback and historical/fixing conversion policy.

5. NY-24 tax credit cap conversion
   - Current: NY-24 uses `130000 HUF / USDHUF`, with fallback `USDHUF=360` when no rate is available.
   - TODO: confirm official fallback and historical/fixing conversion policy.

## NY-14 implemented differences

- Variant id/code/currency: `alfa_zen_pro_ny14` / `NY-14` / `EUR`.
- Minimum annual payment:
  - 10-14 years: 1200 EUR
  - 15-19 years: 900 EUR
  - 20+ years: 600 EUR
- Minimum extraordinary payment: 200 EUR.
- Partial surrender fee: 10 EUR.
- Policy issuance cancellation fee amount: 40 EUR (still feature-flagged).
- Risk accidental death benefit: 5000 EUR.
- Paid-up maintenance monthly cap: 5 EUR (`0.01%/month`, capped).
- Bonus milestones:
  - 10-11 years: year 7 -> 90%
  - 12 years: year 8 -> 90%
  - 13-14 years: year 9 -> 90%
  - 15-19 years: year 10 -> 115%, pre-maturity anniversary -> 35%
  - 20+ years: year 10 -> 70%, year 15 -> 70%, pre-maturity anniversary -> 70%

## NY-24 implemented differences

- Variant id/code/currency: `alfa_zen_pro_ny24` / `NY-24` / `USD`.
- Minimum annual payment:
  - 10-14 years: 1200 USD
  - 15-19 years: 900 USD
  - 20+ years: 600 USD
- Minimum extraordinary payment: 200 USD.
- Partial surrender fee: 10 USD.
- Policy issuance cancellation fee amount: 40 USD (still feature-flagged).
- Risk accidental death benefit: 5000 USD.
- Paid-up maintenance monthly cap: 5 USD (`0.01%/month`, capped).
- Bonus milestones:
  - 10-11 years: year 7 -> 90%
  - 12 years: year 8 -> 90%
  - 13-14 years: year 9 -> 90%
  - 15-19 years: year 10 -> 115%, pre-maturity anniversary -> 35%
  - 20+ years: year 10 -> 70%, year 15 -> 70%, pre-maturity anniversary -> 70%
