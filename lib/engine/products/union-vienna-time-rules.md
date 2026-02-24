# UNION Vienna Time nyugdijbiztositas (564/584/606) - V1 szabalyok

## Termekazonositas
- Product family: `union-vienna-time` (UI: egy termek)
- Engine Product IDs (alias):
  - `union-vienna-time-564`
  - `union-vienna-time-584`
  - `union-vienna-time-606`
- Engine variansok:
  - `union_vienna_time_564` (Erste)
  - `union_vienna_time_584` (Standard)
  - `union_vienna_time_606` (Select)
- MNB kodok: `564`, `584`, `606`
- V1 deviza dontes: szamitas HUF-only.

## V1-ben implementalt szabalyok

### Tartam es minimumok
- Tartam clamp: 5-80 ev.
- Minimum eves rendszeres dij: 120 000 HUF.
- Eseti minimum (informacios konstans): 25 000 HUF.
- Minimum bent marado egyenleg reszvisszavasarlas utan: 200 000 HUF.

### Kezdeti es rendszeres koltsegek
- Kezdeti koltsegtabla (1-3. ev), tartamfuggoen:
  - 5 ev: 42/0/0
  - 10 ev: 72/8/0
  - 15 ev: 72/42/5
  - 20 ev: 72/42/10
- Rendszeres adminisztracios koltseg:
  - eves dij >= 300 000: 2%
  - egyebkent: 3%
- Kockazati dij V1: eves dij 4%-a (havi bontasban terhelve).
- Szamlafenntartasi dij:
  - eves dij >= 300 000: havi 0.15%
  - eves dij >= 180 000: havi 0.199%
  - egyebkent: havi 0.225%
- Eseti egyszeri admin dij: 2.5% (V1 default).

### Visszavasarlas es tranzakcios dijak
- Teljes visszavasarlasi fix dij: 25 000 HUF.
- Reszvisszavasarlasi tranzakcios dij:
  - 0.3%
  - minimum 350 HUF
  - maximum 3 500 HUF
- Eseti korai visszavasarlas V1-kozelites:
  - ha ugyanabban az evben van eseti befizetes es eseti kivonas,
  - a metszet osszegere 2% plusz koltseg.

### Bonuszok
- Husegbonusz (csak "eligible" profilnal):
  - 10. ev: minimum eves dij 100%
  - 15. ev: minimum eves dij 100%
  - 20. ev: minimum eves dij 100% (V1 egyszerusitett, nincs savozas)
- Lejarati bonusz (10-20 ev tartam):
  - anchor: 10. vagy 15. ev
  - formula: `yearsAfterAnchor * minimumAnnualPayment * 0.2`

### Adojovairas
- V1-ben aktiv (`enableTaxCredit=true`):
  - rate: 20%
  - cap: 130 000 HUF/ev
  - repayment on surrender: 20% (V1 default)

## UI/Mapping V1
- A termekvalasztoban egyetlen UNION Vienna Time termek szerepel.
- A varians csatorna-profillal valaszthato:
  - Erste -> 564
  - Standard -> 584
  - Select -> 606
- A 3 oldal (`osszehasonlitas`, `osszesites`, `reszletes-adatok`) HUF-ra allitja az effectiveCurrency-t,
  es a `productVariant` alapjan oldja fel a 564/584/606 variansokat.

## V1 korlatok / egyszerusitesek
- A 3/6 honapos eseti szabalyok idopontos, napi szintu modellezese nincs.
- A teljes visszavasarlas fix dij V1-ben szazalekos kozeliteskent is megjelenhet egyes pathokon.
- Specifikus halaleseti szolgaltatas es komplex rider viselkedes nincs kulon modellezve.
- Nincs kulon event-szintu allapotgep a reszvisszavasarlas utani bonusz-jogosultsagra.

## V2 backlog
- Eseti 3/6 honapos szabaly idopontos (daily) modellezese.
- Bonusz-jogosultsag explicit event allapotgeppel.
- Teljes visszavasarlas fix dijanak teljesen esemenyalapu kezelese.
- Kiterjesztett rider/death benefit logika termekszinten.
