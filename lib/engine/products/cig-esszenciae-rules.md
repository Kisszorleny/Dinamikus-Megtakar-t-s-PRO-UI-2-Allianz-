# CIG Pannonia EsszenciaE rule notes

This file documents implemented rules for the `cig-esszenciae` product and the strict, explicitly flagged gaps.

## Implemented strict flags

- `CIG_ESSZENCIAE_STRICT_UNSPECIFIED_RULES=true`
- `CIG_ESSZENCIAE_ENABLE_AGE_BASED_RISK_TABLE=false`
- `CIG_ESSZENCIAE_ENABLE_EXTRA_ACCOUNT_QUARTERLY_FEE=false`
- `CIG_ESSZENCIAE_ENABLE_SWITCH_FEE_TRACKING=false`
- `CIG_ESSZENCIAE_ENABLE_POSTAL_PAYOUT_FEE=false`
- `CIG_ESSZENCIAE_ENABLE_TAJOLO_LIFECYCLE_AUTO_SWITCH=false`
- `CIG_ESSZENCIAE_ENABLE_FULL_DURATION_INITIAL_COST_TABLE=false`

## Implemented product rules

- Variants:
  - HUF: MNB `P0151`, product code `-`, variant id `cig_esszenciae_huf`
  - EUR: MNB `P0251`, product code `-`, variant id `cig_esszenciae_eur`
- Tax credit: fixed OFF (`enableTaxCredit=false`)
- Duration:
  - Minimum `10` years
  - Maximum `80` years
  - Age-at-maturity cap: `90`
- Minimum annual regular payment:
  - HUF: `150000`
  - EUR: `540`
- Minimum extraordinary payment:
  - HUF: `10000`
  - EUR: `1` (temporary strict fallback until tariff exact minimum is confirmed)
- Paid-up maintenance fee:
  - HUF: `500 / month`
  - EUR: `1.6 / month`
- Initial cost matrix:
  - HUF:
    - 10y: `78, 47, 18, 10, 18, 0+`
    - 15y bucket: `78, 47, 18, 18, 18, 18, 0+`
    - 20y+: `78, 47, 18, 18, 18, 18, 18, 0+`
  - EUR:
    - 10y: `78, 33, 18, 18, 10, 0+`
    - 15y bucket: `78, 33, 18, 43, 18, 18, 0+`
    - 20y+: `78, 33, 18, 18, 43, 18, 18, 0+`
- Full surrender: `100%` value table (`redemptionFeeByYear=0`)
- Partial surrender fixed fallback:
  - Percent target: `0.3%` (flagged TODO in engine)
  - Min fixed fee fallback in engine:
    - HUF: `300`
    - EUR: `1`
  - Minimum balance after partial surrender:
    - HUF: `150000`
    - EUR: `540`
- Bonus:
  - Year 7: one-time amount on first annual payment
    - HUF: `70%`
    - EUR: `90%`
  - From year 8 onward: `1%` yearly bonus schedule (engine-level approximation)

## Flagged TODO rules

1. Age-based risk fee table
   - Current: disabled.
   - TODO: implement insurer annex by entry age and risk cover.
2. Fund-level asset fee matrix and first 3-year regular-account exemption
   - Current: simplified fallback; per-fund table not fully wired.
   - TODO: implement complete fund mapping and account-specific exemption logic.
3. Extraordinary account quarterly fee (`0.25%/quarter`)
   - Current: disabled.
   - TODO: apply quarterly average-balance charging for extraordinary account.
4. Switch and payout transaction fee matrix
   - Current: disabled.
   - TODO: implement yearly free switch count and min/max fee caps by channel and currency.
5. Pannonia Tajolo auto lifecycle switching
   - Current: disabled.
   - TODO: implement automatic lifecycle portfolio migration logic.
6. Full duration initial cost table beyond 10/15/20+ buckets
   - Current: grouped fallback for 11-19 years.
   - TODO: add complete tariff table per exact duration.
7. Bonus 2 account basis
   - Current: engine calculates on total account value approximation.
   - TODO: calculate only from regular premium account monthly basis, post annually.
# CIG Pannonia EsszenciaE rule notes

This file documents implemented rules for the `cig-esszenciae` product and the strict, explicitly flagged gaps.

## Implemented strict flags

- `CIG_ESSZENCIAE_STRICT_UNSPECIFIED_RULES=true`
- `CIG_ESSZENCIAE_ENABLE_AGE_BASED_RISK_TABLE=false`
- `CIG_ESSZENCIAE_ENABLE_EXTRA_ACCOUNT_QUARTERLY_FEE=false`
- `CIG_ESSZENCIAE_ENABLE_SWITCH_FEE_TRACKING=false`
- `CIG_ESSZENCIAE_ENABLE_POSTAL_PAYOUT_FEE=false`
- `CIG_ESSZENCIAE_ENABLE_TAJOLO_LIFECYCLE_AUTO_SWITCH=false`
- `CIG_ESSZENCIAE_ENABLE_FULL_DURATION_INITIAL_COST_TABLE=false`

## Implemented product rules

- Variants:
  - HUF: MNB `P0151`, product code `-`, variant id `cig_esszenciae_huf`
  - EUR: MNB `P0251`, product code `-`, variant id `cig_esszenciae_eur`
- Tax credit: fixed OFF (`enableTaxCredit=false`)
- Duration:
  - Minimum `10` years
  - Maximum `80` years
  - Age-at-maturity cap: `90`
- Minimum annual regular payment:
  - HUF: `150000`
  - EUR: `540`
- Minimum extraordinary payment:
  - HUF: `10000`
  - EUR: `1` (temporary strict fallback until tariff exact minimum is confirmed)
- Paid-up maintenance fee:
  - HUF: `500 / month`
  - EUR: `1.6 / month`
- Initial cost matrix:
  - HUF:
    - 10y: `78, 47, 18, 10, 18, 0+`
    - 15y bucket: `78, 47, 18, 18, 18, 18, 0+`
    - 20y+: `78, 47, 18, 18, 18, 18, 18, 0+`
  - EUR:
    - 10y: `78, 33, 18, 18, 10, 0+`
    - 15y bucket: `78, 33, 18, 43, 18, 18, 0+`
    - 20y+: `78, 33, 18, 18, 43, 18, 18, 0+`
- Full surrender: `100%` value table (`redemptionFeeByYear=0`)
- Partial surrender fixed fallback:
  - Percent target: `0.3%` (flagged TODO in engine)
  - Min fixed fee fallback in engine:
    - HUF: `300`
    - EUR: `1`
  - Minimum balance after partial surrender:
    - HUF: `150000`
    - EUR: `540`
- Bonus:
  - Year 7: one-time amount on first annual payment
    - HUF: `70%`
    - EUR: `90%`
  - From year 8 onward: `1%` yearly bonus schedule (engine-level approximation)

## Flagged TODO rules

1. Age-based risk fee table
   - Current: disabled.
   - TODO: implement insurer annex by entry age and risk cover.
2. Fund-level asset fee matrix and first 3-year regular-account exemption
   - Current: simplified fallback; per-fund table not fully wired.
   - TODO: implement complete fund mapping and account-specific exemption logic.
3. Extraordinary account quarterly fee (`0.25%/quarter`)
   - Current: disabled.
   - TODO: apply quarterly average-balance charging for extraordinary account.
4. Switch and payout transaction fee matrix
   - Current: disabled.
   - TODO: implement yearly free switch count and min/max fee caps by channel and currency.
5. Pannonia Tajolo auto lifecycle switching
   - Current: disabled.
   - TODO: implement automatic lifecycle portfolio migration logic.
6. Full duration initial cost table beyond 10/15/20+ buckets
   - Current: grouped fallback for 11-19 years.
   - TODO: add complete tariff table per exact duration.
7. Bonus 2 account basis
   - Current: engine calculates on total account value approximation.
   - TODO: calculate only from regular premium account monthly basis, post annually.
# CIG Pannonia EsszenciaE rule notes

This file documents implemented rules for the `cig-esszenciae` product and the strict, explicitly flagged gaps.

## Implemented strict flags

- `CIG_ESSZENCIAE_STRICT_UNSPECIFIED_RULES=true`
- `CIG_ESSZENCIAE_ENABLE_AGE_BASED_RISK_TABLE=false`
- `CIG_ESSZENCIAE_ENABLE_EXTRA_ACCOUNT_QUARTERLY_FEE=false`
- `CIG_ESSZENCIAE_ENABLE_SWITCH_FEE_TRACKING=false`
- `CIG_ESSZENCIAE_ENABLE_POSTAL_PAYOUT_FEE=false`
- `CIG_ESSZENCIAE_ENABLE_TAJOLO_LIFECYCLE_AUTO_SWITCH=false`
- `CIG_ESSZENCIAE_ENABLE_FULL_DURATION_INITIAL_COST_TABLE=false`

## Implemented product rules

- Variants:
  - HUF: MNB `P0151`, product code `-`, variant id `cig_esszenciae_huf`
  - EUR: MNB `P0251`, product code `-`, variant id `cig_esszenciae_eur`
- Tax credit: fixed OFF (`enableTaxCredit=false`)
- Duration:
  - Minimum `10` years
  - Maximum `80` years
  - Age-at-maturity cap: `90`
- Minimum annual regular payment:
  - HUF: `150000`
  - EUR: `540`
- Minimum extraordinary payment:
  - HUF: `10000`
  - EUR: `1` (temporary strict fallback until tariff exact minimum is confirmed)
- Paid-up maintenance fee:
  - HUF: `500 / month`
  - EUR: `1.6 / month`
- Initial cost matrix:
  - HUF:
    - 10y: `78, 47, 18, 10, 18, 0+`
    - 15y bucket: `78, 47, 18, 18, 18, 18, 0+`
    - 20y+: `78, 47, 18, 18, 18, 18, 18, 0+`
  - EUR:
    - 10y: `78, 33, 18, 18, 10, 0+`
    - 15y bucket: `78, 33, 18, 43, 18, 18, 0+`
    - 20y+: `78, 33, 18, 18, 43, 18, 18, 0+`
- Full surrender: `100%` value table (`redemptionFeeByYear=0`)
- Partial surrender fixed fallback:
  - Percent target: `0.3%` (flagged TODO in engine)
  - Min fixed fee fallback in engine:
    - HUF: `300`
    - EUR: `1`
  - Minimum balance after partial surrender:
    - HUF: `150000`
    - EUR: `540`
- Bonus:
  - Year 7: one-time amount on first annual payment
    - HUF: `70%`
    - EUR: `90%`
  - From year 8 onward: `1%` yearly bonus schedule (engine-level approximation)

## Flagged TODO rules

1. Age-based risk fee table
   - Current: disabled.
   - TODO: implement insurer annex by entry age and risk cover.
2. Fund-level asset fee matrix and first 3-year regular-account exemption
   - Current: simplified fallback; per-fund table not fully wired.
   - TODO: implement complete fund mapping and account-specific exemption logic.
3. Extraordinary account quarterly fee (`0.25%/quarter`)
   - Current: disabled.
   - TODO: apply quarterly average-balance charging for extraordinary account.
4. Switch and payout transaction fee matrix
   - Current: disabled.
   - TODO: implement yearly free switch count and min/max fee caps by channel and currency.
5. Pannonia Tajolo auto lifecycle switching
   - Current: disabled.
   - TODO: implement automatic lifecycle portfolio migration logic.
6. Full duration initial cost table beyond 10/15/20+ buckets
   - Current: grouped fallback for 11-19 years.
   - TODO: add complete tariff table per exact duration.
7. Bonus 2 account basis
   - Current: engine calculates on total account value approximation.
   - TODO: calculate only from regular premium account monthly basis, post annually.
