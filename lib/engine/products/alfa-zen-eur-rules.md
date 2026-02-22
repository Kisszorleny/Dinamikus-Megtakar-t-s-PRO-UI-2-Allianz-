# Alfa Zen (NY13/NY23) rule notes

This file documents shared Alfa Zen variant rules (NY13 EUR, NY23 USD) that are intentionally guarded by explicit flags until insurer tariff details are fully confirmed.

## Implemented strict flags

- `ALFA_ZEN_STRICT_UNSPECIFIED_RULES=true`
- `ALFA_ZEN_ENABLE_PROVISIONAL_INITIAL_COST_CURVE=true`
- `ALFA_ZEN_ENABLE_BONUS_PAUSE_MULTIPLIER=false`
- `ALFA_ZEN_ENABLE_POLICY_ISSUANCE_CANCELLATION_FEE=false`

## Flagged TODO rules

1. Initial cost detailed table (year 2/year 3)
   - Current: provisional duration-bracket mapping in `ALFA_ZEN_PROVISIONAL_INITIAL_COST_RANGES`.
   - TODO: replace with insurer-approved tariff table.

2. Bonus suspension multipliers
   - Current: disabled by default (`ALFA_ZEN_ENABLE_BONUS_PAUSE_MULTIPLIER=false`).
   - TODO: add complete month->multiplier table once provided.

3. Policy issuance cancellation fee (40 EUR/USD within 30 days)
   - Current: disabled by default (`ALFA_ZEN_ENABLE_POLICY_ISSUANCE_CANCELLATION_FEE=false`).
   - TODO: wire a dedicated UI event flag instead of encoding this in `productVariant`.

4. Tax credit conversion policy
   - Current:
     - NY13: `130000 HUF / EURHUF` (fallback EURHUF=400)
     - NY23: `130000 HUF / USDHUF` (fallback USDHUF=360)
   - TODO: confirm official fallback and historical/fixing policy for both variants.

5. NY23 money market maintenance discount
   - Current: NY23 has no discount, every account uses `0.165%/hó`.
   - TODO: confirm if any USD-specific fund exception is introduced later.
