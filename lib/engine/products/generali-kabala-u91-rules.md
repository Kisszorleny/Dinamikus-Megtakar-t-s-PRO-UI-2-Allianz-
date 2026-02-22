# Generali Kabala (U91) rules notes

This document tracks implemented rules and strict TODO/feature-flag items for the Generali Kabala (U91) calculator brain.

## Implemented

- Product placement: single product with 2 variants:
  - `generali_kabala_u91_life`
  - `generali_kabala_u91_pension`
- Product code for both variants: `U91`.
- Currency: `HUF`.
- Duration limits:
  - life: `15-85` years
  - pension: `10-50` years
- Entry age limits:
  - life: `15-85`
  - pension: `15-55`
- Regular distribution/acquisition fee schedule:
  - year 1: `80%`
  - year 2: `50%`
  - year 3: `20%`
  - years 4-15: `3%`
  - year 16+: `0%`
- Pension short-term (`10-14y`) regular distribution/acquisition overrides:
  - 10y: year2 `3%`, year3 `3%`
  - 11y: year2 `12%`, year3 `6.5%`
  - 12y: year2 `21%`, year3 `10%`
  - 13y: year2 `30%`, year3 `13.5%`
  - 14y: year2 `40%`, year3 `17%`
- Extraordinary payment distribution fee default: `1%`.
- Account maintenance monthly fee by fund:
  - money market 2016: `0.16%`
  - other funds: `0.175%`
- Regular-payment-origin units start maintenance from month `37`.
- Loyalty credit bonus milestones (amount-based) implemented from yearly payment averages:
  - year 10: `8%`
  - year 15: `36%`
  - year 20: `56%`
- Pension short-term loyalty credit addition (`16-19y` term):
  - paid at maturity year (`16/17/18/19`) on years `16..maturity` average net regular payment
  - rates: `6.5% / 12.5% / 18.5% / 24.5%`
- Wealth bonus schedule (yearly percent):
  - term 16-19 years: `0.2%` from year 16
  - term 20+ years: years 16-20 `0.5%`, year 21+ `0.7%`
- Contribution bonus tiers implemented per year by annual payment:
  - `240k-300k`: `1.5%`
  - `300k-480k`: `2.5%`
  - `480k-650k`: `3%`
  - `650k+`: `5%`
- Full surrender fee modeled as `0%`.
- Minimum extraordinary payment surfaced in UI: `10 000 Ft`.
- Minimum balance after partial surrender in engine input: `100 000 Ft`.
- Pension variant tax credit defaults:
  - rate: `20%`
  - annual cap: `130 000 Ft`
  - surrender repayment: `120%` of posted tax credits (`+20%` penalty)

## Strict TODO / feature flags

- `GENERALI_KABALA_U91_ENABLE_FIDELITY_ACCOUNT_MODEL=false`
  - Fidelity account remains optional; when enabled, short-term pension (`10-14y`) accelerated release schedule is applied:
    - 10y: 100% at year 10
    - 11-14y: 80% at year 10 and remaining 100% at maturity year
  - Full account-level mechanics (exact unit-level ledger rules) remain simplified.
- `GENERALI_KABALA_U91_ENABLE_EXTRA_DISTRIBUTION_FEE_DURING_SUSPENSION=false`
  - The temporary `3%` extraordinary fee during suspension is not active.
- `GENERALI_KABALA_U91_ENABLE_COLLECTION_FEE_BY_PAYMENT_METHOD=false`
  - Payment-method based collection fee (`check: 250 Ft/month`) is not active.
- `GENERALI_KABALA_U91_ENABLE_SWITCH_FEE_MODEL=false`
  - Switching cost policy (first two free, then 0.3% min/max, online free) is not active.
- `GENERALI_KABALA_U91_ENABLE_PARTIAL_SURRENDER_PERCENT_FEE=false`
  - Partial surrender and regular withdrawal fee (`0.3%`, min `400`, max `3500`) is not active due current engine constraints (fixed-fee input only).
- `GENERALI_KABALA_U91_ENABLE_POLICY_ISSUANCE_CANCELLATION_FEE=false`
  - Policy issuance cancellation fee (`8000 Ft`, 30-day window) not active unless explicit scenario toggle is added.
- Admin fee timing (`500 Ft/month from year 4`) is approximated via annual plus-cost mapping in preset/default integration; exact monthly start behavior is marked for future engine-level refinement.
