# UI Bővítési Útmutató

## Áttekintés
Most, hogy csak UI logika van (nincs mögöttes számítási logika), könnyen hozzáadhatsz új UI elemeket:
- **Gombok** (Button)
- **Legördülő menük** (Select, DropdownMenu)
- **Checkboxok, Radio gombok**
- **Input mezők**
- **Kártyák** (Card)
- **Accordion, Collapsible** komponensek

---

## Promptolási Tippek - Mire figyelj!

### ✅ JÓ Prompt Példák:

#### 1. **Konkrét és Specifikus**
```
"Hozzáadok egy új gombot a 'Részletes adatok' szekcióhoz, 
ami megnyitja egy legördülő menüt. A menüben 3 opció legyen:
- 'Havi részlet'
- 'Éves részlet'  
- 'Összesített részlet'
A kiválasztott opciót mentsd sessionStorage-ba 'detailViewMode' kulccsal."
```

#### 2. **UI Lokációt Specifikálj**
```
"A 'Kamatláb beállítások' kártyában, az 'Éves kamatláb' input alatt 
adj hozzá egy Select legördülő menüt 'Részletesség' címkével.
Opciók: 'Alap', 'Részletes', 'Teljes'. 
Default: 'Alap'"
```

#### 3. **State Kezelés Specifikálása**
```
"Készíts egy új checkboxot 'Speciális beállítások' szöveggel.
A checkbox állapotát tárold useState-ben 'showAdvanced' néven.
Ha true, akkor jelenjen meg egy Collapsible komponens alatta
3 input mezővel: 'Min. összeg', 'Max. összeg', 'Prioritás'."
```

#### 4. **Interakciót Specifikálj**
```
"Az 'Összesítés' gomb mellé add hozzá egy 'Export' gombot.
Kattintáskor jelenjen meg egy DropdownMenu 4 opcióval:
- 'PDF exportálás'
- 'Excel exportálás'
- 'CSV exportálás'
- 'Nyomtatás'
Ezek még ne csináljanak semmit, csak megjelenjenek (TODO komment)."
```

---

### ❌ ROSSZ Prompt Példák (kerüld ezeket!):

#### 1. **Túl általános**
```
"Adj hozzá gombokat" 
→ ❌ Túl tág, nem tudom hova, mit, hogyan
```

#### 2. **Számítási logikát kér**
```
"Adj hozzá egy gombot ami kiszámolja az adókedvezményt"
→ ❌ Most nincs számítási logika, csak UI
```

#### 3. **Nem specifikálja a helyet**
```
"Adj hozzá egy legördülő menüt 3 opcióval"
→ ❌ Hol? Melyik szekcióban? Milyen névvel?
```

---

## Jó Prompt Struktúra

### Alapképlet:
```
1. MIT akarsz? (gomb, legördülő menü, input, stb.)
2. HOL? (melyik kártyában/szekcióban, melyik elem alatt/mellett)
3. MIÉRT? (mit csináljon, milyen opciók legyenek)
4. STATE? (hol tároljam az állapotot: useState név, sessionStorage kulcs)
5. VISUÁLIS? (szín, méret, placeholder szöveg)
```

### Példa teljes prompt:
```
"Készíts egy új gombot 'Szűrés' szöveggel, az 'Éves bontás' táblázat 
felett, jobbra igazítva. Kattintáskor egy DropdownMenu jelenjen meg
5 opcióval: 'Minden év', 'Első 5 év', 'Utolsó 5 év', '10 év felett', 
'10 év alatt'. A kiválasztott értéket tárold useState-ben 
'yearFilter' néven (default: 'Minden év'). A kiválasztás alapján 
szűrd a táblázat megjelenítését (csak a UI, nincs számítás)."
```

---

## Elérhető UI Komponensek

### Gombok
```tsx
<Button variant="default|outline|secondary|ghost|destructive">
  Szöveg
</Button>
```

### Legördülő Menük
```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Válassz..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="opcio1">Opció 1</SelectItem>
    <SelectItem value="opcio2">Opció 2</SelectItem>
  </SelectContent>
</Select>
```

### Checkbox
```tsx
<Checkbox checked={state} onCheckedChange={setState} />
```

### Input
```tsx
<Input 
  type="text|number"
  value={state}
  onChange={(e) => setState(e.target.value)}
  placeholder="..."
/>
```

### Card (Kártya)
```tsx
<Card>
  <CardHeader>
    <CardTitle>Cím</CardTitle>
  </CardHeader>
  <CardContent>
    {/* tartalom */}
  </CardContent>
</Card>
```

### Collapsible (Becsukható)
```tsx
<Collapsible open={isOpen} onOpenChange={setIsOpen}>
  <CollapsibleTrigger>Kattints</CollapsibleTrigger>
  <CollapsibleContent>
    Tartalom
  </CollapsibleContent>
</Collapsible>
```

---

## State Kezelés Minta

### useState példa:
```tsx
const [myValue, setMyValue] = useState<string>("default")

// Használat:
<Select value={myValue} onValueChange={setMyValue}>
  ...
</Select>
```

### sessionStorage példa:
```tsx
// Olvasás
useEffect(() => {
  if (typeof window !== "undefined") {
    const stored = sessionStorage.getItem("myKey")
    if (stored) {
      setMyValue(stored)
    }
  }
}, [])

// Írás
const handleChange = (value: string) => {
  setMyValue(value)
  sessionStorage.setItem("myKey", value)
}
```

---

## Fontos Megjegyzések

1. **Nincs számítási logika**: Az új elemek csak UI-t jelenítsenek meg, állapotot tároljanak, de ne számoljanak semmit.

2. **TODO kommentek**: Ha később kell valami funkcionalitás, add hozzá:
   ```tsx
   // TODO: Implementáljuk később az export funkciót
   ```

3. **TypeScript típusok**: Használj megfelelő típusokat:
   ```tsx
   const [filter, setFilter] = useState<"all" | "first5" | "last5">("all")
   ```

4. **Meglévő komponensek**: A `components/ui/` mappában lévő komponenseket használd, ne készíts újakat (hacsak nem szükséges).

5. **Konzisztencia**: Nézd meg a meglévő kódot, és ugyanazt a stílust kövesd (pl. `h-11` input magasság, `space-y-1` távolságok).

---

## Gyors Referencia - Hol találod a kódot?

- **Fő komponens**: `components/savings-calculator.tsx`
- **UI komponensek**: `components/ui/`
- **Summary oldal**: `app/osszesites/page.tsx`
- **Típusok**: `lib/calculate-results-daily.tsx`, `lib/calculator-context.tsx`

