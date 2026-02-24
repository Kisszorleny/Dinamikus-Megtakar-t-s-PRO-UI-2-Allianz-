# Signal Iduna Nyugdijprogram (SN005) - V1 szabalyok

## Termekazonositas
- Product ID: `signal-nyugdijprogram-sn005`
- Product code / MNB code: `SN005`
- Engine variant: `signal_nyugdijprogram_sn005_huf`
- Devizanem: HUF

## V1-ben implementalt szabalyok

### Tartam es minimumok
- Tartam becsles `durationUnit + durationValue` alapjan.
- Tartam clamp: 10-80 ev.
- Rendszeres minimum dijak:
  - havi: 12 000 Ft
  - negyedeves: 36 000 Ft
  - feleves: 72 000 Ft
  - eves: 144 000 Ft
- Eseti minimum dij: 35 000 Ft.

### Szerzodeskotesi es admin koltsegek
- Szerzodeskotesi koltseg:
  - 1. ev: 74%
  - 2. ev: tartamfuggo (10 evnel 8%, 20+ evnel 44%)
  - 3. ev: tartamfuggo (10-17 ev: 0%, 18: 4%, 19: 9%, 20+: 14%)
- Rendszeres admin koltseg: 6%.
- Eseti admin koltseg savosan modellezve (eves fix plusz koltsegkent):
  - 3M-ig 3%
  - 3M-10M kozott 2%
  - 10M felett 1%

### VAK (vagyonaranyos koltseg)
- Foszamla:
  - 1-3. ev: 0%
  - 4. evtol: 2% / ev
- Eseti es adojovairasi szamla utvonal:
  - kezdettol: 2% / ev
- Kivetel:
  - HOLD Szef Abszolut Hozamu es Amundi Ovatos Kotveny alapszeru azonositasnal 1.6% / ev.

### Reszleges visszavasarlas
- Engedelyezett (`allowPartialSurrender=true`).
- Dij:
  - 0.3%,
  - minimum 300 Ft,
  - maximum 1 500 Ft.
- Minimum bent marado egyenleg: 100 000 Ft.

### Nyugdij-specifikus adojovairas
- `enableTaxCredit=true`.
- Adojovairas alap:
  - rate: 20%
  - cap: 130 000 Ft/ev
- Konyveles kulon adojovairasi account-ra (`isTaxBonusSeparateAccount=true`).
- Visszafizetesi arany visszavasarlasnal: 20%.

### Bonuszok
- Dijnagysag szerinti bonusz: eves dij >= 300 000 Ft eseten +1%.
- Dijmod szerinti bonusz: banki atutalas vagy csoportos beszedes profil eseten +1%.
- Ongondoskodasi (huseg) bonusz:
  - alap: elso 3 evben levont szerzodeskotesi koltseg osszege,
  - 4-15. ev: evi 5% accrual,
  - 16-20. ev: evi 8% accrual,
  - felszabaditas: 10. evtol 5 evente 50% a felhalmozott egyenlegbol.

## V1 korlatok / egyszerusitesek
- A halaleseti szolgaltatas konkret payout aga (max(2x elso eves dij, szamlaertek), 1M cap) nincs esemenyszinten modellezve.
- A termekspecifikus, alapkezeloi negyedeves vagyonaranyos bonusz-visszaterites nincs reszleteiben lekonyvelve.
- A 65. szulinapi lejarati korhatar explicit eletkor-alapu korlatozasa nincs kulon lifecycle szabalyrendszerbe kotve.

## V2 backlog
- Halaleseti es kozlekedesi baleseti halaleseti szolgaltatas teljes, esemeny-alapu szamitasa.
- Alapkezeloi listara bontott negyedeves vagyonaranyos bonusz-visszairas (HOLD/Amundi teteles szabalyokkal).
- 30 napos felmondas koltsegenek es dijszuneteltetes koltsegenek teljes workflow alapu kezelese.
- Jaradekszolgaltatas kezelesi koltsegenek (630 Ft/ho) kulon allapotgepes modellezese.
