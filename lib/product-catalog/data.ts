import type { ProductCatalogSeedItem, ProductCatalogUiItem } from "@/lib/product-catalog/types"

export const PRODUCT_CATALOG_SOURCE_REF = "manual_mnb_list_2026_02_25"

const isConfirmedCode = (code: string): boolean => {
  const normalized = code.trim().toLowerCase()
  if (!normalized) return false
  return !["todo", "unknown", "-", "n/a", "na", "placeholder"].includes(normalized)
}

function codeStatus(code: string): "confirmed" | "unknown" {
  return isConfirmedCode(code) ? "confirmed" : "unknown"
}

function nullableCode(code: string): string | null {
  return isConfirmedCode(code) ? code.trim() : null
}

export const PRODUCT_CATALOG_UI: ProductCatalogUiItem[] = [
  {
    insurer: "Alfa",
    value: "alfa_exclusive_plus",
    label: "Alfa Exclusive Plus",
    productType: "Nyugdíjbiztosítás / Életbiztosítás",
    mnbCode: "13430 / 13450",
    productCode: "NY-05 / TR-08",
    variants: [
      { value: "alfa_exclusive_plus_ny05", label: "NY-05 (Nyugdíjbiztosítás)", productType: "Nyugdíjbiztosítás", mnbCode: "13430", productCode: "NY-05" },
      { value: "alfa_exclusive_plus_tr08", label: "TR-08 (Életbiztosítás)", productType: "Életbiztosítás", mnbCode: "13450", productCode: "TR-08" },
    ],
  },
  {
    insurer: "Allianz",
    value: "allianz_eletprogram",
    label: "Allianz Életprogram",
    productType: "Életbiztosítás",
    mnbCode: "992120 / 892120",
    productCode: "AL-01",
  },
  {
    insurer: "Allianz",
    value: "allianz_bonusz_eletprogram",
    label: "Allianz Bónusz Életprogram",
    productType: "Életbiztosítás",
    mnbCode: "982120 / 882120",
    productCode: "AL-02",
  },
  {
    insurer: "CIG Pannonia",
    value: "cig_esszenciae",
    label: "CIG Pannonia EsszenciaE",
    productType: "Életbiztosítás",
    mnbCode: "P0151 / P0251",
    productCode: "-",
  },
  {
    insurer: "CIG Pannonia",
    value: "cig_nyugdijkotvenye",
    label: "CIG Pannonia NyugdijkotvenyE",
    productType: "Nyugdíjbiztosítás",
    mnbCode: "P0139",
    productCode: "NyugdijkotvenyE",
    variants: [
      {
        value: "cig_nyugdijkotvenye_nyugdij",
        label: "NyugdijkotvenyE (Nyugdíjbiztosítás)",
        productType: "Nyugdíjbiztosítás",
        mnbCode: "P0139",
        productCode: "NyugdijkotvenyE",
      },
    ],
  },
  {
    insurer: "Generali",
    value: "generali_kabala",
    label: "Generali Kabala",
    productType: "Életbiztosítás / Nyugdíjbiztosítás",
    mnbCode: "U91",
    productCode: "U91",
    variants: [
      { value: "generali_kabala_u91_life", label: "U91 (Életbiztosítás)", productType: "Életbiztosítás", mnbCode: "U91", productCode: "U91" },
      { value: "generali_kabala_u91_pension", label: "U91 (Nyugdíjbiztosítás)", productType: "Nyugdíjbiztosítás", mnbCode: "U91", productCode: "U91" },
    ],
  },
  {
    insurer: "Generali",
    value: "generali_mylife_extra_plusz",
    label: "Generali MyLife Extra Plusz",
    productType: "Életbiztosítás / Nyugdíjbiztosítás",
    mnbCode: "U67P",
    productCode: "U67P",
  },
  {
    insurer: "Grupama",
    value: "groupama_easy",
    label: "Groupama Easy Életbiztosítás",
    productType: "Életbiztosítás",
    mnbCode: "GB730",
    productCode: "EASY",
  },
  {
    insurer: "Grupama",
    value: "groupama_next",
    label: "Groupama Next Életbiztosítás",
    productType: "Életbiztosítás",
    mnbCode: "GB733",
    productCode: "NEXT",
  },
  {
    insurer: "KnH",
    value: "knh_hozamhalmozo",
    label: "K&H Hozamhalmozo 4",
    productType: "Életbiztosítás",
    mnbCode: "113",
    productCode: "KH-HHZ4",
  },
  {
    insurer: "KnH",
    value: "knh_nyugdijbiztositas4",
    label: "K&H Nyugdijbiztositas 4",
    productType: "Nyugdíjbiztosítás",
    mnbCode: "173",
    productCode: "KH-NY4",
  },
  {
    insurer: "Magyar Posta",
    value: "posta_trend",
    label: "Posta Trend",
    productType: "Életbiztosítás",
    mnbCode: "23073",
    productCode: "23073",
  },
  {
    insurer: "Magyar Posta",
    value: "posta_trend_nyugdij",
    label: "Posta Trend Nyugdij",
    productType: "Nyugdíjbiztosítás",
    mnbCode: "23074",
    productCode: "23073-NY",
  },
  {
    insurer: "MetLife",
    value: "metlife_manhattan",
    label: "MetLife Manhattan",
    productType: "Életbiztosítás",
    mnbCode: "MET-689 / MET-789",
    productCode: "MET-689 / MET-789",
  },
  {
    insurer: "MetLife",
    value: "metlife_nyugdijprogram",
    label: "MetLife Nyugdijprogram",
    productType: "Nyugdíjbiztosítás",
    mnbCode: "MET-688 / MET-788",
    productCode: "MET-688 / MET-788",
  },
  {
    insurer: "NN",
    value: "nn_eletkapu_119",
    label: "NN Életkapu 119",
    productType: "Életbiztosítás",
    mnbCode: "119",
    productCode: "119",
  },
  {
    insurer: "NN",
    value: "nn_motiva_158",
    label: "NN Motiva 158",
    productType: "Nyugdíjbiztosítás",
    mnbCode: "158 / 168",
    productCode: "158 / 168",
  },
  {
    insurer: "NN",
    value: "nn_visio_118",
    label: "NN Visio 118",
    productType: "Életbiztosítás",
    mnbCode: "118",
    productCode: "118",
  },
  {
    insurer: "NN",
    value: "nn_vista_128",
    label: "NN Vista 128",
    productType: "Életbiztosítás",
    mnbCode: "128",
    productCode: "128",
  },
  {
    insurer: "Signal Iduna",
    value: "signal_elorelato_ul001",
    label: "Előrelátó Program",
    productType: "Életbiztosítás",
    mnbCode: "UL001",
    productCode: "UL001",
  },
  {
    insurer: "Signal Iduna",
    value: "signal_nyugdij_terv_plusz_ny010",
    label: "SIGNAL Nyugdíj terv Plusz",
    productType: "Nyugdíjbiztosítás",
    mnbCode: "NY010",
    productCode: "NY010",
  },
  {
    insurer: "Signal Iduna",
    value: "signal_nyugdijprogram_sn005",
    label: "SIGNAL IDUNA Nyugdíjprogram",
    productType: "Nyugdíjbiztosítás",
    mnbCode: "SN005",
    productCode: "SN005",
  },
  {
    insurer: "Signal Iduna",
    value: "signal_ongondoskodasi_wl009",
    label: "Öngondoskodási terv 2.0 Plusz",
    productType: "Életbiztosítás",
    mnbCode: "WL009",
    productCode: "WL009",
  },
  {
    insurer: "Union",
    value: "union_vienna_age_505",
    label: "UNION Vienna Age Nyugdíjbiztosítás",
    productType: "Nyugdíjbiztosítás",
    mnbCode: "505",
    productCode: "505",
  },
  {
    insurer: "Union",
    value: "union_vienna_plan_500",
    label: "UNION Vienna Plan Életbiztosítás",
    productType: "Életbiztosítás",
    mnbCode: "500",
    productCode: "500",
  },
  {
    insurer: "Union",
    value: "union_vienna_time",
    label: "UNION Vienna Time Nyugdíjbiztosítás",
    productType: "Nyugdíjbiztosítás",
    mnbCode: "564 / 584 / 606",
    productCode: "564 / 584 / 606",
  },
  {
    insurer: "Uniqa",
    value: "uniqa_eletcel_275",
    label: "Életcél",
    productType: "Életbiztosítás",
    mnbCode: "275",
    productCode: "275",
  },
  {
    insurer: "Uniqa",
    value: "uniqa_premium_life_190",
    label: "Premium Life",
    productType: "Életbiztosítás",
    mnbCode: "190",
    productCode: "190",
  },
]

export function buildProductCatalogSeedItems(sourceRef: string = PRODUCT_CATALOG_SOURCE_REF): ProductCatalogSeedItem[] {
  const rows: ProductCatalogSeedItem[] = []

  for (const product of PRODUCT_CATALOG_UI) {
    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        rows.push({
          insurer: product.insurer,
          productName: variant.label || `${product.label} ${variant.productType}`,
          productValue: product.value,
          variantValue: variant.value ?? null,
          productType: variant.productType,
          mnbCode: variant.mnbCode,
          // Conservative seed policy: product code is unknown unless explicitly confirmed from source docs.
          productCode: null,
          productCodeStatus: "unknown",
          sourceRef,
        })
      }
    } else {
      rows.push({
        insurer: product.insurer,
        productName: product.label,
        productValue: product.value,
        variantValue: null,
        productType: product.productType,
        mnbCode: product.mnbCode,
        // Conservative seed policy: product code is unknown unless explicitly confirmed from source docs.
        productCode: null,
        productCodeStatus: "unknown",
        sourceRef,
      })
    }
  }

  return rows
}
