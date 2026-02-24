# SIGNAL Nyugdij Terv Plusz (NY010) - V1 szabalyok

## Termekazonositas
- Product ID: `signal-nyugdij-terv-plusz-ny010`
- Product code / MNB code: `NY010`
- Engine variant: `signal_nyugdij_terv_plusz_ny010_huf`
- Devizanem: HUF

## V1-ben implementalt szabalyok

### Tartam es minimumok
- Tartam becsles `durationUnit + durationValue` alapjan.
- Tartam clamp: 10-80 ev.
- Rendszeres minimum dij (tartamfuggo):
  - 10-14 ev tartam: havi minimum 20 000 Ft (evesitve 240 000 Ft)
  - 15+ ev tartam: havi minimum 15 000 Ft (evesitve 180 000 Ft)
- Eseti minimum dij: 35 000 Ft.

### Szerzodeskotesi es admin koltsegek
- Szerzodeskotesi koltseg:
  - 1. ev: 74%
  - 2. ev: tartamfuggo (10 evnel 8%, 20+ evnel 44%)
  - 3. ev: tartamfuggo (10-17 ev: 0%, 18: 4%, 19: 9%, 20+: 14%)
- Rendszeres admin koltseg: 6%.
- Eseti admin koltseg: 1%.

### VAK (vagyonaranyos koltseg)
- Foszamla:
  - 1-3. ev: 0%
  - 4. evtol: 2% / ev
- Eseti, lojalitasi es adojovairasi szamla:
  - kezdettol: 2% / ev
- Kivetel:
  - SIFI rovid kotveny alap felismeresenel 1.3% / ev.

### Reszleges visszavasarlas / penzkivonas
- Engedelyezett (`allowPartialSurrender=true`).
- Dij:
  - 0.3%,
  - minimum 300 Ft,
  - maximum 5 000 Ft.
- Minimum bent marado egyenleg: 50 000 Ft.

### Nyugdij-specifikus adojovairas
- `enableTaxCredit=true`.
- Adojovairas alap:
  - rate: 20%
  - cap: 130 000 Ft/ev
- Konyveles kulon adojovairasi account-ra (`isTaxBonusSeparateAccount=true`).
- Visszafizetesi arany visszavasarlasnal: 20%.

### Bonuszok
- Dijnagysag szerinti bonusz:
  - minimum dijszint teljesulese eseten 2% eves bonusz.
- Ongondoskodasi bonusz:
  - alap: elso 3 evben levont szerzodeskotesi koltsegek osszege,
  - 37-180. honap: evi 5% accrual,
  - 181-240. honap: evi 8% accrual,
  - felszabaditas: 10. evtol 5 evente 50%.
- Hozamplusz bonusz (egyszerusitett V1):
  - legalabb 20 eves tartam: 10. evtol evi 0.3%
  - legalabb 25 eves tartam: 10-19. ev evi 0.3%, 20. evtol evi 2%

## V1 korlatok / egyszerusitesek
- Halaleseti szolgaltatas teljes, esemeny-alapu szamitasa nincs modellezve.
- Erteknoveles/indexalas (`FIX/KSH/EUR`) automatizmus nincs kulon lifecycle szinten modellezve.
- Alapkezelonkenti negyedeves befektetesi koltseg-visszaterites nincs tetelesen lekonyvelve.
- 30 napos felmondas, dijszuneteltetes, jaradekszolgaltatas workflow nincs allapotgepesitve.

## V2 backlog
- Halaleseti szolgaltatas teljes implementacioja (2x elso eves dij plafonlogikaval, erteknoveles kovetessel).
- Indexalasi modok teljes parameter- es idozitesi kezelese.
- Negyedeves, alapkezelonkenti visszateritesi modul.
- Felmondas, dijszuneteltetes, dijmentesites es jaradek allapotgepes workflow-ja.
