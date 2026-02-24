# MetLife Nyugdijprogram (MET-688 / MET-788) - V2 Backlog

Ez a dokumentum a `metlife-nyugdijprogram` V1 utánra ütemezett részletes szabályokat rögzíti.

## 1) Kockázati díj teljes táblázat

- V1-ben a kockázati díj kikapcsolt (`riskInsuranceEnabled=false`).
- V2-ben szükséges:
  - teljes koréves díjtábla (nem csak mintapontok),
  - tarifakód és biztosítási összeg szerinti szorzók,
  - pontos havi levonási mechanika.

## 2) Díjbeszedési költség részletesítés

- V1-ben Basic default approximáció szerepel (évesített, frekvencia-alapú).
- V2-ben szükséges:
  - fizetési mód szerinti pontos díjak (csekk/beszedés/átutalás),
  - HUF/EUR tartományok dátumhatály szerinti feloldása,
  - eseményszintű terhelés (nem évesített közelítés).

## 3) Rövid tartam akvizíciós mátrix teljessé tétele

- V1-ben explicit 5 és 7 éves pontok + konzisztens fallback.
- V2-ben szükséges:
  - teljes biztosítói mátrix 5-9 év között,
  - annex forrás szerinti véglegesítés.

## 4) Bónusz-jogosultság teljes feltételrendszer

- V1-ben küszöb + folyamatos díjfizetés + no főszámla withdrawal alapfeltétel van modellezve.
- V2-ben szükséges:
  - díjmentesítés/szüneteltetés és egyéb kizáró okok eseményszintű kezelése,
  - lejáratkori (25+ év) bónusz pontos termékfeltétel szerinti időzítése.

## 5) TKMNy kalkuláció

- V1-ben nincs dedikált TKMNy modul.
- V2-ben szükséges:
  - TKMNy számítás külön szolgáltatásban,
  - HUF/EUR idősávos riport (10/20 év) egységes UI megjelenítéssel.
