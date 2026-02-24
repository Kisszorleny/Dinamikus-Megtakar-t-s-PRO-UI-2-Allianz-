import type { ProductDefinition } from "./types"
import { dmPro } from "./dm-pro"
import { allianzEletprogram } from "./allianz-eletprogram"
import { alfaExclusivePlus } from "./alfa-exclusive-plus"
import { alfaFortis } from "./alfa-fortis"
import { alfaJade } from "./alfa-jade"
import { alfaJovokep } from "./alfa-jovokep"
import { alfaJovotervezo } from "./alfa-jovotervezo"
import { alfaPremiumSelection } from "./alfa-premium-selection"
import { alfaRelaxPlusz } from "./alfa-relax-plusz"
import { alfaZenPro } from "./alfa-zen-pro"
import { alfaZen } from "./alfa-zen"
import { cigEsszenciae } from "./cig-esszenciae"
import { cigNyugdijkotvenye } from "./cig-nyugdijkotvenye"
import { generaliKabalaU91 } from "./generali-kabala-u91"
import { generaliMylifeExtraPlusz } from "./generali-mylife-extra-plusz"
import { groupamaEasy } from "./groupama-easy"
import { groupamaNext } from "./groupama-next"
import { knhHozamhalmozo } from "./knh-hozamhalmozo"
import { knhNyugdijbiztositas4 } from "./knh-nyugdijbiztositas4"
import { metlifeManhattan } from "./metlife-manhattan"
import { metlifeNyugdijprogram } from "./metlife-nyugdijprogram"
import { nnEletkapu119 } from "./nn-eletkapu-119"
import { nnMotiva158 } from "./nn-motiva-158"
import { nnVista128 } from "./nn-vista-128"
import { nnVisio118 } from "./nn-visio-118"
import { postaTrend } from "./posta-trend"
import { postaTrendNyugdij } from "./posta-trend-nyugdij"
import { signalElorelatoUl001 } from "./signal-elorelato-ul001"
import { signalNyugdijTervPluszNy010 } from "./signal-nyugdij-terv-plusz-ny010"
import { signalNyugdijprogramSn005 } from "./signal-nyugdijprogram-sn005"
import { signalOngondoskodasiWl009 } from "./signal-ongondoskodasi-wl009"
import { uniqaEletcel275 } from "./uniqa-eletcel-275"
import { uniqaPremiumLife190 } from "./uniqa-premium-life-190"
import { unionViennaAge505 } from "./union-vienna-age-505"
import { unionViennaPlan500 } from "./union-vienna-plan-500"
import { unionViennaTime } from "./union-vienna-time"

export const PRODUCTS = {
  "dm-pro": dmPro,
  "allianz-eletprogram": allianzEletprogram,
  "alfa-exclusive-plus": alfaExclusivePlus,
  "alfa-fortis": alfaFortis,
  "alfa-jade": alfaJade,
  "alfa-jovokep": alfaJovokep,
  "alfa-jovotervezo": alfaJovotervezo,
  "alfa-premium-selection": alfaPremiumSelection,
  "alfa-relax-plusz": alfaRelaxPlusz,
  "alfa-zen-pro": alfaZenPro,
  "alfa-zen": alfaZen,
  "alfa-zen-eur": alfaZen,
  "cig-esszenciae": cigEsszenciae,
  "cig-nyugdijkotvenye": cigNyugdijkotvenye,
  "generali-kabala-u91": generaliKabalaU91,
  "generali-mylife-extra-plusz": generaliMylifeExtraPlusz,
  "groupama-easy": groupamaEasy,
  "groupama-next": groupamaNext,
  "knh-hozamhalmozo": knhHozamhalmozo,
  "knh-nyugdijbiztositas4": knhNyugdijbiztositas4,
  "metlife-manhattan": metlifeManhattan,
  "metlife-manhattan-eur": metlifeManhattan,
  "metlife-nyugdijprogram": metlifeNyugdijprogram,
  "metlife-nyugdijprogram-eur": metlifeNyugdijprogram,
  "nn-eletkapu-119": nnEletkapu119,
  "nn-motiva-158": nnMotiva158,
  "nn-motiva-168": nnMotiva158,
  "nn-vista-128": nnVista128,
  "nn-visio-118": nnVisio118,
  "posta-trend": postaTrend,
  "posta-trend-nyugdij": postaTrendNyugdij,
  "signal-elorelato-ul001": signalElorelatoUl001,
  "signal-nyugdij-terv-plusz-ny010": signalNyugdijTervPluszNy010,
  "signal-nyugdijprogram-sn005": signalNyugdijprogramSn005,
  "signal-ongondoskodasi-wl009": signalOngondoskodasiWl009,
  "uniqa-eletcel-275": uniqaEletcel275,
  "uniqa-premium-life-190": uniqaPremiumLife190,
  "union-vienna-age-505": unionViennaAge505,
  "union-vienna-plan-500": unionViennaPlan500,
  "union-vienna-time-564": unionViennaTime,
  "union-vienna-time-584": unionViennaTime,
  "union-vienna-time-606": unionViennaTime,
} satisfies Record<string, ProductDefinition>

export type ProductId = keyof typeof PRODUCTS

export function getProduct(productId: ProductId): ProductDefinition {
  return PRODUCTS[productId]
}
