# MetLife Manhattan (MET-689 / MET-789) - V2 Backlog

Ez a dokumentum a `metlife-manhattan` V1 utánra ütemezett, még nem implementált üzleti szabályokat gyűjti.

## 1) Egyszeri díjas ág

- Külön egyszeri díjas terméklogika modellezése:
  - eltérő VAK táblák (1-15 év: 1.90%, 16+ év: 1.71%)
  - egyszeri díjas ügyfélbónusz mértékek és évfordulók
  - bónusz alapja: `simplePremium - threshold` (HUF/EUR küszöbök)
- V1-ben ez szándékosan nincs bekötve a `metlife-manhattan` product definícióban.

## 2) Kockázati díj táblázat (életkor + tarifa)

- Életkor- és kockázatfüggő havi díjtábla implementálása `riskFeeResolver`-rel.
- Tarifa/annex alapján változó kockázati költség bevezetése.
- V1 döntés szerint a kockázati díj kikapcsolt (`0`) marad.

## 3) Switching díj eseményszintű modellezés

- Áthelyezés díja:
  - normál: `0.3%` (min/max HUF/EUR)
  - online: `0.2%` (min/max HUF/EUR)
- Jelenlegi engine fix `partialSurrenderFeeAmount` mezője nem tud tranzakciónként min/max százalékot kezelni.
- Szükséges: eseményalapú fee hook vagy tranzakciós input terv.

## 4) Portfólió Plusz elkülönített számlalogika

- Eseti díjak külön alszámlás könyvelése Portfólió Plusz szerint.
- Külön díjlevonási és bónusz-jogosultsági viselkedés kezelése.
- V1-ben csak a meglévő engine extra-account struktúra használható.

## 5) Részvisszavásárlás időzítési szabályok

- Rendszeres díjas ág: csak 3 év díjjal fedezett időszak után legyen engedett.
- V1-ben minimum bent maradó egyenleg és fix díj bekötve van, de évszintű tiltási szabály még nincs kényszerítve.
