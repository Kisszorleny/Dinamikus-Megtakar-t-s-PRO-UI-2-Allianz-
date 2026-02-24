# UNION Vienna Plan eletbiztositas (500) - V1 szabalyok

## Termekazonositas
- Product ID: `union-vienna-plan-500`
- Product code / MNB code: `500`
- Engine variansok:
  - `union_vienna_plan_500_huf`
  - `union_vienna_plan_500_eur`
  - `union_vienna_plan_500_usd`
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
  - 20 ev: 72/42/10
  - 20+ ev (eletfogytig V1-kozelites): 72/42/5
- Rendszeres adminisztracios koltseg: eves dij 2%-a.
- Eseti befizeteshez kapcsolt egyszeri koltseg: 2%.
- Vagyonaranyos fenntartasi koltseg:
  - folyamatos szamla: havi 0.15% (V1-ben ez a globalis account-maintenance default),
  - eseti szamla: celertek havi 0.085% (V1-ben kozelites, kulon havi rate nincs szamla-tipusonkent bontva).
- Kockazati dij V1 kozelites: eves dij 2%-anak havi megfelelo terhelese.

### Visszavasarlas es tranzakcios dijak
- Teljes visszavasarlasi fix dij:
  - HUF 25 000 / EUR 70 / USD 70.
- Reszvisszavasarlasi tranzakcios dij:
  - 3 ezrelek (0.3%),
  - minimum: HUF 350 / EUR 1 / USD 1,
  - maximum: HUF 3500 / EUR 10 / USD 10.
- Eseti alszerzodes 3 honapos 2%-os szabaly:
  - V1-ben evesitett kozelites van: ha ugyanabban az evben van eseti befizetes es eseti kivonas, akkor a metszet osszegere 2% plusz koltseg.

### Bonuszok
- Husegbonusz (7/10/15/20. evfordulo):
  - feltetel: 10+ ev tartam es bonusz-jogosultsag (`__bonus_blocked` profil nelkul),
  - 7. ev: minimum eves dij 30%,
  - 10. ev: minimum eves dij 70%,
  - 15. ev: minimum eves dij 100%,
  - 20. ev: minimum eves dij 100% / 150% / 200% savosan.
- Lejarati / teljes visszavasarlasi dijjovairas (10-20 eves tartam):
  - `eltelt teljes evek * minimum eves dij * 20%`,
  - 10-14 evnel a 10. evfordulo utan eltelt evekkel,
  - 15-20 evnel a 15. evfordulo utan eltelt evekkel.
- Extra ugyfelbonusz:
  - V1-ben nincs fix hirdetmeny-parameter, ezert nem aktiv default.

### Adojovairas
- V1 scope dontes alapjan: `enableTaxCredit=false`.

## Valaszok a kiemelt kerdesekre (V1 rendszerben)

### Modellportfolio vs egyedi valasztas
- A jelenlegi alkalmazasban tenylegesen az egyedi eszkozalap/fund valasztas modellezett.
- Modellportfolio-logika (automatikus atallasi allapotgep) V1-ben nincs implementalva ennnel a termeknel.

### Arfolyam-monitor riasztas
- A jelenlegi UI-ban a hozamfigyelo/arfolyam-monitor csak placeholder szolgaltatas.
- Valos ideju arfolyamfigyeles, trigger-kuszob es ertesitesi workflow V1-ben nincs implementalva.

### Elso 5 ev visszavasarlasi veszteseg
- A motor minden evre szamol `surrenderValue` es `surrenderCharge` mezot.
- A veszteseg az adott evben:
  - visszavasarlasi koltseg (redemption),
  - tranzakcios koltseg/részvisszavasarlasi dij,
  - eseti 2%-os korai visszavasarlasi kozelites (ha relevans),
  - es a mar levont kezdeti/admin/fenntartasi koltsegek egyuttes hatasa.

## V1 korlatok / egyszerusitesek
- 30 napon beluli elallas kulon admin koltsege (3500 HUF / 10 EUR / 10 USD) nincs kulon esemenyszinten modellezve.
- A folyamatos es eseti szamla fenntartasi koltsegeinek teljesen kulon havi rate-kezelese nincs kulon allapotgepben.
- A "teljes visszavasarlas konkret idopontban" bonusz-jogosultsag event-szintu kezelese helyett V1-ben tartamvegi joairasi kozelites fut.
- Az eseti 3 honapos szabaly event-szinten helyett evesitett kozelitessel kerul modellezesre.

## V2 backlog
- Eseti alszerzodes 3 honapos szabalyanak tranzakcio-idopontos, nap-levelu modellje.
- 30 napos elallas + admin dij esemenyalapu workflow.
- Modellportfolio opcio (eletciklus/mix valtasok) kulon portfolio-allapotgeppel.
- Arfolyam-monitor valos trigger logika (kuszob, jelzes, idobelyeges esemenyek).
