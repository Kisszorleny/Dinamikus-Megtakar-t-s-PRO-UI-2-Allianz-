# CIG Pannonia NyugdijkotvenyE rule notes

This file documents implemented rules for the `cig-nyugdijkotvenye` product and the strict, explicitly flagged gaps.

## Implemented strict flags

- `CIG_NYUGDIJKOTVENYE_STRICT_UNSPECIFIED_RULES=true`
- `CIG_NYUGDIJKOTVENYE_ENABLE_AGE_BASED_RISK_FEE_TABLE=false`
- `CIG_NYUGDIJKOTVENYE_ENABLE_DEPOSIT_PAYMENT_METHOD_FEES=false`
- `CIG_NYUGDIJKOTVENYE_ENABLE_SWITCH_FEE_TRACKING=false`
- `CIG_NYUGDIJKOTVENYE_ENABLE_PAYOUT_POSTAL_FEE=false`
- `CIG_NYUGDIJKOTVENYE_ENABLE_EXTRA_ACCOUNT_QUARTERLY_MANAGEMENT_FEES=false`
- `CIG_NYUGDIJKOTVENYE_ENABLE_LIQUIDITY_PLUS_ANNUAL_FEE=false`
- `CIG_NYUGDIJKOTVENYE_ENABLE_BONUS_STRICT_ELIGIBILITY_FLAGS=false`
- `CIG_NYUGDIJKOTVENYE_ENABLE_PARTIAL_SURRENDER_PERCENT_FEES=false`

## Implemented product rules

- Currency: `HUF`.
- Minimum duration: `10` years.
- Minimum annual base payment: `150000 HUF`.
- Minimum extraordinary payment: `10000 HUF`.
- Minimum regular withdrawal: `15000 HUF / month`.
- Minimum balance after partial surrender: `100000 HUF`.
- Paid-up maintenance fee: `500 HUF / month`.
- Tax credit is mandatory and always enabled:
  - Rate: `20%`
  - Yearly cap: `130000 HUF`
  - Surrender repayment multiplier: `120%`
- Initial cost table uses full, duration-dependent matrix (8-10, 11, 12, 13, 14, 15+ years).
- Asset-based fee is fund-dependent:
  - Likviditasi Pro: `1.46%`
  - Hazai Top Vallalatok Pro: `1.22%`
  - Tokevedett Pro (2030/2034/2041): `1.30%`
  - Hazai Pro Vegyes: `1.548%`
  - Kelet-europai Pro Reszveny: `1.824%`
  - Other funds: `1.98%`
- Loyalty bonus 1: year 7, `70%` of first yearly base payment (when continuity criteria are met).
- Loyalty bonus 2: `1%` annually from year 8.

## Flagged TODO rules

1. Age-based risk fee table
   - Current: disabled.
   - TODO: implement insurer table by entry age and coverage.

2. Payment-method specific costs
   - Current: disabled.
   - TODO: apply costs by payment channel once tariff is provided.

3. Switching and postal payout transaction fees
   - Current: disabled.
   - TODO: wire yearly free switch limits and min/max fee caps.

4. Quarterly management fees on extraordinary accounts
   - Current: disabled.
   - TODO: add quarterly fee logic for tax-eligible and liquidity accounts.

5. Liquidity Plus annual fee
   - Current: disabled.
   - TODO: add yearly fixed `5000 HUF` handling with dedicated account basis.

6. Bonus strict eligibility checks
   - Current: simplified continuity check is used.
   - TODO: enforce all insurer disqualifiers (fee reduction, suspension, partial surrender source constraints).

7. Partial surrender percent + min/max fee matrix
   - Current: engine uses a fixed fee fallback.
   - TODO: implement account-type specific percent/min/max charging.
