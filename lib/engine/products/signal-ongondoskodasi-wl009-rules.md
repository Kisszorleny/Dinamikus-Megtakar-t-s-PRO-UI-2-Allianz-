# Signal Öngondoskodási terv 2.0 Plusz (WL009) - V1 szabályok

## Termékazonosítás
- Product ID: `signal-ongondoskodasi-wl009`
- Product code / MNB code: `WL009`
- Engine variant: `signal_ongondoskodasi_wl009_huf`
- Devizanem: HUF

## V1-ben implementált szabályok

### Tartam és minimumok
- Tartam becslés `durationUnit + durationValue` alapján.
- Tartam clamp: 1-80 év (engine védőkorlát).
- Rendszeres minimum díjak:
  - havi 15 000 Ft
  - negyedéves 45 000 Ft
  - féléves 90 000 Ft
  - éves 180 000 Ft
- Eseti minimum díj: 35 000 Ft (validator helper).

### Kezdeti és admin költségek
- Szerződéskötési (akvizíciós) költség:
  - 1. év: 64%
  - 2. év: 34%
  - 3. év: 4%
- Rendszeres admin költség:
  - 1-8. év: 16%
  - 9. évtől: 6%
- Eseti díj admin költség: 1%.

### VAK (vagyonarányos költség)
- Alapértelmezett alapok:
  - főszámla: 1-3. év 0%, 4. évtől 2.45% / év
  - eseti + lojalitási logika céljára használt számlarétegek: 2.45% / év
- SIFI U kivétel:
  - minden érintett számlarétegre 1.80% / év
- A SIFI kivételt V1-ben a `selectedFundId` alapján automatikusan próbáljuk felismerni.

### Díjmentesített fenntartás és részleges kivonás
- Díjmentesített szerződés fenntartás: 500 Ft / hó.
- Részleges visszavásárlás / eseti kivonás költség:
  - 0.3% az összegre
  - minimum 300 Ft
  - maximum 5 000 Ft
- Minimum bent maradó érték: 50 000 Ft.

### Bónuszok
- Díjnagyság szerinti bónusz (éves díj sávok alapján) számítása.
- Hűségbónusz: 4-8. évben 10% (éves díjra).
- Öngondoskodási bónusz:
  - 37-180. hónap között 5% / év
  - 181-240. hónap között 8% / év
  - alap: elvont szerződéskötési költségek + az első 36 havi díj 10%-a
- Lojalitási felszabadítás:
  - 10. év: 75%
  - 15. év: maradék 75%
  - 20. év: maradék 100%
- Hozamplusz bónusz:
  - 4. évtől 1% / év (`bonusPercentByYear` útvonalon).

## V1 engine korlátok (ismert egyszerűsítések)
- A lojalitási számla és felszabadítás havi, tranzakció-szintű életciklusa évesített helper logikával van közelítve.
- A több alszámlás VAK-könyvelés a jelenlegi közös motor képességei miatt részben egyszerűsített.
- Díjszüneteltetés (4 000 Ft / alkalom) esemény-szintű trigger nélkül, jelenleg csak konfigurációs konstansként van előkészítve.

## V2 backlog
- Haláleseti szolgáltatás teljes számítása:
  - max(2x első éves díj, számlaérték),
  - 1 000 000 Ft plafon és indexálási hatás.
- 30 napos felmondás költségének esemény-szintű kezelése (max 10 000 Ft).
- Díjszüneteltetés teljes workflow (normál/rendkívüli esemény, alkalom alapú levonás).
- Alapkezelői negyedéves költség-visszatérítés részletes könyvelése.
