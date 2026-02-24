# Signal Előrelátó Program (UL001) - V1 implementation notes

## Implemented in V1
- Product identity and HUF-only variant mapping (`signal-elorelato-ul001`, code `UL001`).
- Duration guardrails: 10-45 years.
- Minimum regular premium guards by frequency (monthly/quarterly/semiannual/annual) and minimum extraordinary premium.
- Initial (acquisition) cost curve:
  - year 1: 74%,
  - year 2: duration-dependent stepped resolver,
  - year 3: duration-dependent resolver (0/4/9/14%),
  - year 4+: 0%.
- Regular payment admin deduction default: 6% (`adminFeePercentOfPayment`).
- Extraordinary payment admin costs modeled as yearly fixed plus cost via tiered bands:
  - up to 3M: 3%,
  - 3M-10M: 2%,
  - above 10M: 1%.
- VAK defaults:
  - main account year 1-3: 0%,
  - main account year 4+: standard 2.00% or reduced-funds 1.60% profile,
  - extra/tax-bonus account path: same annual profile rate (2.00% / 1.60%).
- Partial surrender defaults:
  - enabled,
  - fee approximation from 0.3% with min/max clamp (300..1500 HUF),
  - minimum balance after partial surrender: 100,000 HUF.
- Extended UI profile controls:
  - payment method profile (`bank-transfer` / `direct-debit` / `postal-check`),
  - VAK profile (`standard` / `reduced-funds`),
  - loyalty bonus toggle.
- Bonus defaults:
  - premium-size bonus: +1% on yearly premium above threshold,
  - payment-method bonus: +1% for transfer/direct-debit profiles,
  - loyalty path modeled with yearly accrual + 50% release at 10th year and every 5 years after.

## Deferred to V2
- Full monthly loyalty-unit release lifecycle with exact month-level posting and locking rules.
- Exact contractual death-benefit event flow (2x annual premium cap logic) as explicit event-level payout branch.
- Paid-up, premium-holiday, and contract-state fee events with dedicated lifecycle state machine.
- Full transaction-level partial surrender rules (eligibility windows, exact account-source order, and edge caps).
- Product-list-specific quarterly fund cost refund logic and detailed investment-fund exception tables.
- Additional tax and surrender edge-case handling tied to product-specific legal wording and event timing.
