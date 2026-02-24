# UNIQA Premium Life (190) - V1 szabalyok

## Termekazonositas
- Product ID: `uniqa-premium-life-190`
- Product code / MNB code: `190`
- Engine varians:
  - `uniqa_premium_life_190_huf`
- V1 devizanem: HUF (core_huf scope)

## V1-ben implementalt szabalyok

### Tartam es minimumok
- Tartam clamp: 10-80 ev.
- Rendszeres minimum eves dij: 180 000 HUF.
- Eseti minimum dij (informacios konstans): 20 000 HUF / 100 EUR.

### Kezdeti koltsegek
- Rendszeres dij kezdeti koltseg (elso 3 ev): 80% / 40% / 5%.
- Eseti dij kezdeti koltseg: 1% (`extraordinaryAdminFeePercentOfPayment`).

### Rendszeres dijra vonatkozo dijaranyos koltseg
- 1-3. ev: 0%.
- 4-25. ev:
  - 180 000 - 299 999: 5%
  - 300 000 - 383 999: 3%
  - 384 000+: 2%
- 26. evtol: 1.5%.
- Engine-ben `adminFeePercentByYear` mapkent kerul atadasra.

### Vagyonaranyos koltsegek
- Megtakaritasi egysegek:
  - 1-3. ev: 0%
  - 4-15. ev:
    - alacsony koltsegu alapok: 0%
    - egyeb alapok: 1.95%
  - 16-25. ev:
    - alacsony koltsegu alapok: 1.05%
    - egyeb alapok: 1.5%
  - 26. evtol: minden alap 1%
- Extra egysegek: 1.5% / ev.
- V1-ben a fund-kategoria szerinti differencialas `selectedFundId` alapjan aktiv.

### Kockazati dij
- V1 default: eves dij 4%-a, havi bontasban terhelve.

### Visszavasarlas es reszvisszavasarlas
- Visszavasarlasi gorbe (megtakaritasi egysegre): 2. evtol 11%, 3. ev 9.5%, ... 10. evtol 0%.
- Engine-ben `redemptionBaseMode: "surplus-only"`.
- Reszvisszavasarlas engedelyezett.
- Minimum bent marado egyenleg: max(50 000 HUF, minimum eves dij).

### Adojovairas es bonusz
- `enableTaxCredit: false` (V1 scope dontes).
- Nincs explicit bonusz-jovairas modellezve (`bonusMode: none`).

## V1 korlatok / egyszerusitesek
- A 30 napon beluli felmondasi 10 000 Ft + orvosi koltseg esemenyszintu modellezese nincs.
- Switch dij helper (`0.3%`, min/max) implementalva, de V1 flow-ban nincs tranzakcio-szinten szimulalva.
- Eseti visszavasarlas specialis idozitesi dijai nincsenek kulon modellezve.

## V2 backlog
- Tranzakcio-szintu kapcsolo/atvaltasi dij es kulon admin dijak modellezese.
- Eseti befizeteshez kapcsolodo idozitett visszavasarlasi specialis levonasok.
- Kiterjesztett UI tamogatas fund-kategoria explicit valasztasahoz.
