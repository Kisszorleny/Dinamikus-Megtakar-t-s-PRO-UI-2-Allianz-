# Groupama Next Életbiztosítás - V1 szabályok

## Termékazonosítás
- Product ID: `groupama-next`
- Product code / MNB code: `NEXT` / `NEXT` (placeholder, forrás szerint Groupama Next)
- Engine variánsok:
  - `groupama_next_ul100_trad0_huf`
  - `groupama_next_ul75_trad25_huf`
  - `groupama_next_ul0_trad100_huf`
- V1 devizanem: HUF

## V1-ben implementált szabályok

### Termékrész arányok
- Három fix felosztás támogatott:
  - 100% UL / 0% hagyományos
  - 75% UL / 25% hagyományos
  - 0% UL / 100% hagyományos
- A felosztás V1-ben az `investedShareByYear` arányon keresztül hat a modellre.

### Minimumok
- Minimum rendszeres díj:
  - havi: 12 000 Ft
  - éves: 144 000 Ft
- Minimum eseti díj (információs konstans): 12 000 Ft

### Kezdeti és rendszeres költségek
- Kötvénykiállítási egyszeri költség: 2 500 Ft (V1-ben `plusCostByYear[1]`).
- Adminisztrációs költség: alapértelmezésben 700 Ft/hó.
- Kötelező közlekedési baleseti kockázati díj: 125 Ft/hó.

### Vagyonarányos költségek
- Fenntartási költség: 0,07% / hó.
- UL vagyonarányos költség: 0,03% / hó (csak ahol van UL rész).
- Tőkeőrző szolgáltatás költsége:
  - elérhető helper szinten, de V1 default futásban kikapcsolva.

### Visszavásárlás és bónusz
- Visszavásárlási százalékos görbe nem került modellezésre V1-ben (forrásban nincs egzakt tábla).
- Bónuszok és akciós garantált hozamok V1-ben nem kerültek beépítésre.
- `enableTaxCredit: false`, `bonusMode: none`.

## V1 korlátok / egyszerűsítések
- A hagyományos termékrész külön hozammechanikája nincs külön számlaszinten modellezve.
- Díjátvállalás és Gyermek jövője kiegészítők V1-ben kimaradnak.
- Garantált Hozam 14. akció időszakos szabályai V1-ben kimaradnak.
- Eszközalapváltási tranzakciós költség csak helper szinten érhető el, tranzakciós eseményként nincs bekötve.

## V2 backlog
1. Hagyományos termékrész külön számla/hozam ágazat explicit modellezése.
2. Díjátvállalás (0,5%) és Gyermek jövője faktoros díj teljes modellezése.
3. Garantált Hozam akciók időablakos és állapotfüggő kezelése.
4. Visszavásárlási és részvisszavásárlási költségtábla bevezetése hivatalos kondíciós adatok alapján.
5. Tőkeőrző 65+ korfüggő váltás automatikus kezelése életkor input alapján.
