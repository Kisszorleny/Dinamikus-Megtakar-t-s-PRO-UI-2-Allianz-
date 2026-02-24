# UNIQA Eletcel (275) - V1 szabalyok

## Termekazonositas
- Product ID: `uniqa-eletcel-275`
- Product code / MNB code: `275`
- Engine varians:
  - `uniqa_eletcel_275_huf`
- V1 devizanem: HUF (core_huf scope)

## V1-ben implementalt szabalyok

### Tartam es minimumok
- Tartam clamp: 10-80 ev.
- Rendszeres minimum eves dij: 180 000 HUF.
- Eseti minimum dij (informacios konstans): 20 000 HUF.

### Kezdeti koltsegek
- Rendszeres dij kezdeti koltseg (1-3. ev), 10-20+ eves tablaval:
  - 10 ev: 55% / 20% / 5%
  - 15 ev: 65% / 27.5% / 5%
  - 20+ ev es whole-life kozelites: 75% / 35% / 5%
- Eseti dij kezdeti koltseg: 1% (`extraordinaryAdminFeePercentOfPayment`).

### Rendszeres dijra vonatkozo dijaranyos koltseg
- 1-3. ev: 0% (kezdeti koltseg idoszak).
- 4-25. ev:
  - 180 000 - 299 999: 5%
  - 300 000 - 383 999: 3%
  - 384 000+: 2%
- 26. evtol: 1.5%.
- V1-ben ez `adminFeePercentByYear` mapkent kerül atadasra.

### Vagyonaranyos koltsegek (core egyszerusites)
- Megtakaritasi egysegek:
  - 1-3. ev: 0%
  - 4-15. ev: 1.95%
  - 16-25. ev: 1.5%
  - 26. evtol: 1%
- Extra egysegek:
  - V1 informaciosan dokumentalt: 1.5% eves.
  - Core_huf V1-ben account-szintu kulon extra dijtabla nincs kulon szimulalva.

### Kockazati dij
- V1 default: eves dij 4%-a, havi bontasban terhelve.

### Visszavasarlas es reszvisszavasarlas
- Visszavasarlasi dijtabla (megtakaritasi egysegekre) tartam-kategoria szerint:
  - 10 eves gorbe
  - 15 eves gorbe
  - 20+ / whole-life gorbe
- Engine-ben `redemptionBaseMode: "surplus-only"` alkalmazva.
- Reszvisszavasarlasi minimum bent marado egyenleg: 50 000 HUF (V1 core).
- Kulon penzkivonasi dij: 0 V1-ben.

### Adojovairas es bonusz
- `enableTaxCredit: false` (V1 scope dontes).
- Nincs explicit bonusz-jovairas modellezve (`bonusMode: none`), mert a forras nem tartalmaz konkret bonusztablat.

## V1 korlatok / egyszerusitesek
- Az eszkozalap-kategoria szerinti (kotveny vs egyeb) vagyonaranyos koltseg differencialas egyszerusitett.
- Az EUR-ban fizetett eseti dij kulon devizaag V1-ben nincs kulon modellezve.
- A 30 napon beluli felmondasi 10 000 Ft + orvosi koltseg esemenyszintu modellezese nincs.
- A kapcsolo dij (elso 2 ingyenes, utana 0.45% min/max) V1-ben nincs tranzakcio-szinten szimulalva.

## V2 backlog
- Eszkozalap-tipus szerinti teljes vagyonaranyos koltsegmatrix (kotveny/jelleg spec).
- EUR eseti dijag kulon kezelese es atvaltas hatas modellezese.
- Kapcsolo/felmondasi/elszamolasi dijak tranzakcio-esemeny szintu implementalasa.
