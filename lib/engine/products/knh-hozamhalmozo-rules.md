# K&H Hozamhalmozo 4 - V2 Backlog

Ez a dokumentum a `knh-hozamhalmozo` V1 utánra ütemezett pontosításokat tartalmazza.

## 1) Életkorfüggő kockázati díj

- V1-ben a kockázati díj kikapcsolt (`riskInsuranceEnabled=false`).
- V2-ben szükséges:
  - teljes, évkor-felbontású díjtábla,
  - biztosítási összeg és esetleges szorzók kezelése,
  - eseményszintű havi levonási logika.

## 2) Díjfizetési mód szerinti díjbeszedési költségmátrix

- V1-ben nincs teljes mód-specifikus díjmátrix modellezés.
- V2-ben szükséges:
  - csoportos beszedés / átutalás / bankkártya pontos díjtételei,
  - tartományok és dátumhatályok kezelése,
  - évesített közelítés helyett tranzakciószintű terhelés.

## 3) Kifizetési költségek részletes modellezése

- Külföldi banki utalás és postai kifizetés tényleges költsége jelenleg nincs külön eseményként modellezve.
- V2-ben ezek külön tranzakciós eseményként kerüljenek be.

## 4) Ajándékdíj feltételrendszer finomítása

- V1-ben a jogosultságot folytonos díjfizetés + no withdrawal szabály közelíti.
- V2-ben szükséges:
  - díjszüneteltetés pontos kezelése,
  - részvisszavásárlás és egyéb kizáró események teljes körű kezelése,
  - pontos biztosítói időzítés.

## 5) TKM jellegű riport

- V1-ben nincs dedikált TKM számítás/kimenet.
- V2 cél:
  - külön kalkulációs modul,
  - időtávonkénti riport (pl. 10/15/20 év),
  - UI összehasonlító nézet támogatása.
