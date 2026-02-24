# UNION Vienna Age Nyugdijbiztositas (505) - V1 szabalyok

## Termekazonositas
- Product ID: `union-vienna-age-505`
- Product code / MNB code: `505`
- Engine variansok:
  - `union_vienna_age_505_huf`
  - `union_vienna_age_505_eur`
  - `union_vienna_age_505_usd`
- Devizanemek: HUF, EUR, USD

## V1-ben implementalt szabalyok

### Tartam es minimumok
- Tartam becsles `durationUnit + durationValue` alapjan.
- Tartam clamp: 5-80 ev.
- Rendszeres minimum folyamatos dij:
  - 5-9 ev tartam: HUF 650 000 / EUR 1600 / USD 1600 eves minimum.
  - 10+ ev tartam: HUF 240 000 / EUR 750 / USD 750 eves minimum.
- Eseti minimum dij: HUF 100 000 / EUR 300 / USD 300.

### Kezdeti es rendszeres koltsegek
- Kezdeti koltseg tabla (1-3. ev), tartamfuggoen:
  - 5 ev: 42/0/0
  - 10 ev: 72/8/0
  - 15 ev: 72/42/5
  - 20+ ev: 72/42/10
- Rendszeres adminisztracios koltseg: eves dij 2%-a.
- Eseti befizeteshez kapcsolt egyszeri koltseg V1-ben: 2%.
- Vagyonaranyos fenntartasi koltseg (folyamatos dijas szamla): havi 0.15%.
- Kockazati dij V1 kozelites: eves dij 2%-anak havi megfelelo terhelese.

### Visszavasarlas es tranzakcios dijak (V1 kozelites)
- Teljes visszavasarlasi fix dij:
  - HUF 25 000 / EUR 70 / USD 70.
- Reszvisszavasarlasi tranzakcios dij:
  - 3 ezrelek (0.3%),
  - minimum: HUF 350 / EUR 1 / USD 1,
  - maximum: HUF 3500 / EUR 10 / USD 10.
- A motor fix `partialSurrenderFeeAmount` mezot hasznal, ezert a tranzakcios dij V1-ben mintafee alapu kozelitessel kerul atadasra.

### Bonuszok
- Dijvisszaterites (10/15/20. evfordulo):
  - feltetel: nem volt reszvisszavasarlas a folyamatos dijas szamlarol (UI kapcsoloval modellezve),
  - 10. ev: minimum eves dij 100%,
  - 15. ev: minimum eves dij 100%,
  - 20. ev: minimum eves dij 100% / 150% / 200% savosan.
- Lejarati dijjovairas (10-20 eves tartam):
  - `eltelt teljes evek * minimum eves dij * 20%`,
  - 10-14 evnel a 10. evfordulo utan eltelt evekkel,
  - 15-20 evnel a 15. evfordulo utan eltelt evekkel.

### Nyugdij-specifikus adojovairas
- `enableTaxCredit=true`.
- Adojovairas:
  - rate: 20%
  - cap (V1 kozelites): HUF 130 000 / EUR 325 / USD 350.
- Kulon adojovairasi szamla: `isTaxBonusSeparateAccount=true`.
- Visszafizetes visszavasarlasnal: 20%.

## V1 korlatok / egyszerusitesek
- 30 napon beluli elallas kulon kotvenyesitesi koltsege nincs esemenyszinten modellezve.
- Eseti dijas alszamlak 3/6 honapos, utolso befizeteshez kotott 2%-os levonasa nincs idozitesi/allapotgep szinten modellezve.
- Dijmentesitett allapot teljes workflow-szintu koltseglogikaja nincs kulon allapotgepben kezelve.
- A termek "nyugdijkorhatarig tarto tartam" szabalyat V1-ben nem modellezzuk eletkor-alapon, csak fix user tartammal (min. 5 ev clamp).

## V2 backlog
- Esemenyalapu 30 napos elallas + kotvenyesitesi koltseg modul.
- Eseti szamlak 3/6 honapos 2%-os levonasanak teljes tranzakcio-idopont alapu modellje.
- Dijmentesites, szuneteltetes, allapotvaltasi workflow-k allapotgepes implementacioja.
- Nyugdijkorhatarhoz kotott tartamkepzes (belepesi eletkor + celkorhatar) bevezetese.
