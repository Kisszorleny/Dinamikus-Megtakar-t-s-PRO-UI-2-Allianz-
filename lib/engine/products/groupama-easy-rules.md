# Groupama Easy Eletbiztositas - V1 szabalyok

## Termekazonositas
- Product ID: `groupama-easy`
- Product code / MNB code: `EASY` / `EASY` (placeholder azonosito)
- Engine variansok:
  - `groupama_easy_life_huf`
  - `groupama_easy_life_tax_huf`
- V1 devizanem: HUF

## V1-ben implementalt szabalyok

### Tartam es minimumok
- Tartam becsles: minimum 1 ev.
- Minimum rendszeres dij:
  - havi: 12 000 Ft
  - eves: 144 000 Ft
- Minimum eseti dij (informacios konstans): 12 000 Ft

### Ismert koltsegek (V1 core)
- Adminisztracios koltseg: 700 Ft/honap.
- Fenntartasi koltseg: 0.07% / honap.
- Vagyonaranyos koltseg (VAK): 0.03% / honap.
- Kockazati koltseg: 125 Ft/honap.

### Adojovairas kapcsolhatosag
- V1-ben termeken belul kapcsolhato:
  - `groupama_easy_life_huf`: adojovairas OFF
  - `groupama_easy_life_tax_huf`: adojovairas ON
- ON esetben:
  - `taxCreditRatePercent = 20`
  - `taxCreditCapPerYear = 130000`
- OFF esetben tax mezok nullazva.

### Visszavasarlas es bonuszok
- Visszavasarlasi szazalekos tabla V1-ben nincs bevezetve (forrasban nincs egzakt tabla).
- Bonusz mod: `none`.

## V1 korlatok / egyszerusitesek
- A hagyomanyos termekresz kulon, explicit hozam-agazata nincs modellben.
- Eszkozalapvaltasi, atiranyitasi, extra ertesito dijak nem kerultek tranzakcio-szintu modellezesre.
- 30 napos kulonos felmondas koltsege csak szabalyszintu backlog, nem explicit motorlogika.
- Tobblethozam-visszaterites (legalabb 1%) V1-ben nincs kodolva.

## V2 backlog
1. Kondicios lista szerinti konkret admin/fenntartasi/VAK parameterek teljes tablazatos kezelese.
2. Visszavasarlasi es reszleges visszavasarlasi koltseg tabla bevezetese.
3. Hagyomanyos termekresz kulon tartalek- es hozammodellje.
4. Tranzakcios koltsegek (valtas, atiranyitas, rendkivuli tajekoztato) teljes event-level kezelese.
5. Tobblethozam-visszaterites modellezese (nyeresegtartalek ag).
