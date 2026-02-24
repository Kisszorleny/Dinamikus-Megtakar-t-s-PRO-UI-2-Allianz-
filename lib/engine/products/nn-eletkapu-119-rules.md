# NN Életkapu 119 - rules and V2 backlog

## V1 implemented

- Product identity and variant: HUF-only `119`.
- Duration clamp: 10-25 years.
- Regular premium sales cost by duration and policy year:
  - Year 1: 10%..30% (10y..20y+)
  - Year 2-3: 5%..15% (10y..20y+)
  - Year 4+: 4%
- High premium rule: part above 2,000,000 HUF/year charged at 4% via weighted yearly effective rate.
- Admin fee matrix prepared in resolver (frequency x payment method), with default non-postal profile.
- Paid-up monthly maintenance fee (940 HUF) represented via `paidUpMaintenanceFeeMonthlyAmount`.
- Accident death cover monthly fee represented via age-based resolver (142 / 170 HUF).
- Asset-based yearly fee (VAK) resolver:
  - General profiles: 1.25%, 1.40%, 1.70%, 1.82%
  - Target-date profile: 1.70% / 1.55% / 1.40% by remaining years
- Surrender payout modeled on year-level duration profile and transformed to `redemptionFeeByYear`.
- Partial surrender on plus units approximated with fixed fee estimate from 3 per mille with min/max cap.
- Bonus defaults: none (source set contains no explicit loyalty/extra bonus schedule).

## Known V1 limitations

- No UI selectors yet for:
  - payment method (postal vs non-postal),
  - contract state (paid vs paid-up),
  - asset profile selection,
  - number of insured persons.
- Regular sales fee uses yearly totals, while source wording is transaction-level investment part.
- Extraordinary (single) payment sales fee is exposed as a single percent default, not a per-transaction ladder.
- Surrender logic is modeled yearly; full month-level table and exact monthly windows are not yet encoded.
- Partial surrender fee is approximated to a fixed value in the current engine input model.
- Plus-unit-only withdrawal path cannot be perfectly enforced with current generic withdrawal inputs.

## V2 backlog

1. Add UI parameters and persistence for payment method, paid-up state, VAK profile, and insured count.
2. Extend engine inputs for transaction-level extraordinary fee ladders and per-event fee caps/minimums.
3. Add month-level surrender payout table implementation for 0-11, 12-23, ... windows.
4. Add two-main-insured modeling for accident death fee (independent age fee per insured).
5. Add event-time switching/program-change cost rules:
   - annual free switch limits,
   - channel-dependent min/max fee caps,
   - redirection change fee rules.
6. Add policy cancellation (30-day) fee cap rule with annual premium 1/12 cap.
