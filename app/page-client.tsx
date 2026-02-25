"use client"

import type { FormEvent } from "react"
import { useMemo, useState } from "react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { buildCalcSummary, collectCalcSnapshotFromSession } from "@/lib/leads/client-calc-snapshot"

type RequestType = "A" | "B" | "C"

type ContactFormState = {
  name: string
  email: string
  phone: string
}

type ContactFormErrors = Partial<Record<keyof ContactFormState, string>>
type RequestFormState = {
  aSaver: string
  aBeneficiary: string
  aGoal: string
  aBirthdate: string
  aAmount: string
  aFrequency: string
  aHorizon: string
  aInsurer: string
  bcProductType: string
  bcProductName: string
  bcStart: string
  bcEnd: string
  bcFrequency: string
  bcAmount: string
  bcIndex: string
  bcFund: string
}

const GOAL_OPTIONS = [
  { value: "nyugdij", label: "Nyugdíj" },
  { value: "gyermekjovo", label: "Gyermekjövő" },
  { value: "tokenoveles", label: "Tőkenövelés" },
]

const BENEFICIARY_OPTIONS = [
  { value: "nincs", label: "Nem kérek kedvezményezettet" },
  { value: "onmaga", label: "Önmagam" },
  { value: "hazastars", label: "Házastárs / partner" },
  { value: "gyermek", label: "Gyermek" },
  { value: "egyeb", label: "Egyéb személy" },
]

const PRODUCT_TYPE_OPTIONS = [
  { value: "eletbiztositas", label: "Életbiztosítás" },
  { value: "nyugdijbiztositas", label: "Nyugdíjbiztosítás" },
  { value: "befekteteshez-kotott", label: "Befektetéshez kötött biztosítás" },
  { value: "egyeb", label: "Egyéb" },
]

const FREQUENCY_OPTIONS = [
  { value: "havi", label: "Havi" },
  { value: "negyedeves", label: "Negyedéves" },
  { value: "feleves", label: "Féléves" },
  { value: "eves", label: "Éves" },
]

export default function PageClient() {
  const [requestType, setRequestType] = useState<RequestType>("A")
  const [contactOpen, setContactOpen] = useState(false)
  const [contactSent, setContactSent] = useState(false)
  const [contactError, setContactError] = useState("")
  const [contactErrors, setContactErrors] = useState<ContactFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contact, setContact] = useState<ContactFormState>({
    name: "",
    email: "",
    phone: "",
  })
  const [form, setForm] = useState<RequestFormState>({
    aSaver: "",
    aBeneficiary: "",
    aGoal: "",
    aBirthdate: "",
    aAmount: "",
    aFrequency: "",
    aHorizon: "",
    aInsurer: "",
    bcProductType: "",
    bcProductName: "",
    bcStart: "",
    bcEnd: "",
    bcFrequency: "",
    bcAmount: "",
    bcIndex: "",
    bcFund: "",
  })

  const ctaLabel = useMemo(
    () => (requestType === "A" ? "Kérem a legjobb ajánlatot" : "Kérem a részletes elemzésem"),
    [requestType],
  )

  const resetDialogState = () => {
    setContactSent(false)
    setContactError("")
    setContactErrors({})
  }

  const openContactDialog = () => {
    resetDialogState()
    setContactOpen(true)
  }

  const closeContactDialog = () => {
    setContactOpen(false)
  }

  const validateContactForm = (payload: ContactFormState) => {
    const errors: ContactFormErrors = {}
    if (!payload.name.trim()) {
      errors.name = "Kérlek add meg a neved."
    }
    if (!payload.email.trim()) {
      errors.email = "Kérlek add meg az email címed."
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
      errors.email = "Kérlek érvényes email címet adj meg."
    }
    if (!payload.phone.trim()) {
      errors.phone = "Kérlek add meg a telefonszámod."
    } else if (payload.phone.replace(/[^\d+]/g, "").length < 8) {
      errors.phone = "Kérlek érvényes telefonszámot adj meg."
    }
    return errors
  }

  const getRequestFormPayload = () => {
    if (requestType === "A") {
      return {
        saver: form.aSaver,
        beneficiary: form.aBeneficiary,
        goal: form.aGoal,
        birthdate: form.aBirthdate,
        amount: form.aAmount,
        frequency: form.aFrequency,
        horizon: form.aHorizon,
        preferredInsurer: form.aInsurer,
      }
    }
    return {
      productType: form.bcProductType,
      productName: form.bcProductName,
      startDate: form.bcStart,
      endDate: form.bcEnd,
      frequency: form.bcFrequency,
      amount: form.bcAmount,
      index: form.bcIndex,
      fund: form.bcFund,
    }
  }

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setContactError("")

    const errors = validateContactForm(contact)
    setContactErrors(errors)
    if (Object.keys(errors).length > 0) return

    setIsSubmitting(true)
    try {
      const calcSnapshot = collectCalcSnapshotFromSession()
      const calcSummary = buildCalcSummary(calcSnapshot)
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "landing_popup",
          requestType,
          contact,
          formPayload: getRequestFormPayload(),
          calcSnapshot,
          calcSummary,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.ok) {
        setContactError(data?.message ?? "Nem sikerült elküldeni az igényt. Kérlek próbáld újra.")
        return
      }
      setContactSent(true)
    } catch {
      setContactError("Nem sikerült elküldeni az igényt. Kérlek próbáld újra.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 md:py-14">
        <header className="space-y-2">
          <p className="text-sm text-muted-foreground">Dinamikus Megtakarítás Kalkulátor</p>
          <h1 className="text-2xl font-semibold md:text-3xl">Találjuk meg együtt a legjobb megoldást</h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            Válaszd ki, miben segíthetünk: új megtakarítás indításában, meglévő szerződés összehasonlításában, vagy
            teljes portfólióelemzésben.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Rövid igényfelmérés</CardTitle>
            <CardDescription>Először válassz egy kategóriát, majd töltsd ki az adatokat.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-medium">Milyen segítséget kérsz?</Label>
              <RadioGroup
                value={requestType}
                onValueChange={(value) => setRequestType(value as RequestType)}
                className="grid gap-3 md:grid-cols-3"
              >
                <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4 hover:bg-muted/40">
                  <RadioGroupItem value="A" id="type-a" className="mt-0.5" />
                  <div>
                    <p className="font-medium">A - Új megtakarítást szeretnék</p>
                    <p className="text-sm text-muted-foreground">Nincs még megtakarításom, de szeretnék.</p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4 hover:bg-muted/40">
                  <RadioGroupItem value="B" id="type-b" className="mt-0.5" />
                  <div>
                    <p className="font-medium">B - Összehasonlítás</p>
                    <p className="text-sm text-muted-foreground">Meglévő megtakarításomat hasonlítanám össze.</p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4 hover:bg-muted/40">
                  <RadioGroupItem value="C" id="type-c" className="mt-0.5" />
                  <div>
                    <p className="font-medium">C - Portfólióelemzés</p>
                    <p className="text-sm text-muted-foreground">Átfogó elemzést szeretnék kérni.</p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            {requestType === "A" ? (
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="a-saver">1. Ki az, aki megtakarít?</Label>
                  <Input
                    id="a-saver"
                    placeholder="pl. Saját névre"
                    value={form.aSaver}
                    onChange={(event) => setForm((prev) => ({ ...prev, aSaver: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="a-beneficiary">2. Ki a kedvezményezett?</Label>
                  <Select
                    value={form.aBeneficiary}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, aBeneficiary: value }))}
                  >
                    <SelectTrigger id="a-beneficiary" className="w-full">
                      <SelectValue placeholder="Válassz kedvezményezettet" />
                    </SelectTrigger>
                    <SelectContent>
                      {BENEFICIARY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="a-goal">3. Mi a megtakarítás célja?</Label>
                  <Select value={form.aGoal} onValueChange={(value) => setForm((prev) => ({ ...prev, aGoal: value }))}>
                    <SelectTrigger id="a-goal" className="w-full">
                      <SelectValue placeholder="Válassz célt" />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="a-birthdate">4. Születési dátum</Label>
                  <Input
                    id="a-birthdate"
                    type="date"
                    value={form.aBirthdate}
                    onChange={(event) => setForm((prev) => ({ ...prev, aBirthdate: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="a-amount">5. Mekkora összeggel indulnál?</Label>
                  <Input
                    id="a-amount"
                    type="number"
                    min={0}
                    placeholder="pl. 30000"
                    value={form.aAmount}
                    onChange={(event) => setForm((prev) => ({ ...prev, aAmount: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="a-frequency">Fizetési gyakoriság</Label>
                  <Select
                    value={form.aFrequency}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, aFrequency: value }))}
                  >
                    <SelectTrigger id="a-frequency" className="w-full">
                      <SelectValue placeholder="Válassz gyakoriságot" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="a-horizon">6. Időtáv (év)</Label>
                  <Input
                    id="a-horizon"
                    type="number"
                    min={1}
                    placeholder="pl. 10"
                    value={form.aHorizon}
                    onChange={(event) => setForm((prev) => ({ ...prev, aHorizon: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="a-insurer">7. Preferált biztosító</Label>
                  <Select value={form.aInsurer} onValueChange={(value) => setForm((prev) => ({ ...prev, aInsurer: value }))}>
                    <SelectTrigger id="a-insurer" className="w-full">
                      <SelectValue placeholder="Válassz biztosítót" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="allianz">Allianz</SelectItem>
                      <SelectItem value="alfa">Alfa</SelectItem>
                      <SelectItem value="generali">Generali</SelectItem>
                      <SelectItem value="groupama">Groupama</SelectItem>
                      <SelectItem value="union">Union</SelectItem>
                      <SelectItem value="nincs">Nincs preferenciám</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full border-dashed"
                    onClick={() => setForm((prev) => ({ ...prev, aInsurer: "nincs" }))}
                  >
                    Nincs preferenciám, kérem a jelenlegi legjobb ajánlatot!
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bc-product-type">Termék típusa</Label>
                  <Select
                    value={form.bcProductType}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, bcProductType: value }))}
                  >
                    <SelectTrigger id="bc-product-type" className="w-full">
                      <SelectValue placeholder="Válassz típust" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bc-product-name">Melyik termékkel rendelkezel?</Label>
                  <Input
                    id="bc-product-name"
                    placeholder="pl. Allianz Életprogram"
                    value={form.bcProductName}
                    onChange={(event) => setForm((prev) => ({ ...prev, bcProductName: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bc-start">Tartam kezdete</Label>
                  <Input
                    id="bc-start"
                    type="date"
                    value={form.bcStart}
                    onChange={(event) => setForm((prev) => ({ ...prev, bcStart: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bc-end">Tartam vége</Label>
                  <Input
                    id="bc-end"
                    type="date"
                    value={form.bcEnd}
                    onChange={(event) => setForm((prev) => ({ ...prev, bcEnd: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bc-frequency">Fizetési gyakoriság</Label>
                  <Select
                    value={form.bcFrequency}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, bcFrequency: value }))}
                  >
                    <SelectTrigger id="bc-frequency" className="w-full">
                      <SelectValue placeholder="Válassz gyakoriságot" />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bc-amount">Összeg</Label>
                  <Input
                    id="bc-amount"
                    type="number"
                    min={0}
                    placeholder="pl. 25000"
                    value={form.bcAmount}
                    onChange={(event) => setForm((prev) => ({ ...prev, bcAmount: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bc-index">Index</Label>
                  <Input
                    id="bc-index"
                    placeholder="pl. 5% / év"
                    value={form.bcIndex}
                    onChange={(event) => setForm((prev) => ({ ...prev, bcIndex: event.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bc-fund">Eszközalap, amiben a pénz van</Label>
                  <Input
                    id="bc-fund"
                    placeholder="pl. Kiegyensúlyozott vegyes alap"
                    value={form.bcFund}
                    onChange={(event) => setForm((prev) => ({ ...prev, bcFund: event.target.value }))}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="button" onClick={openContactDialog}>
                {ctaLabel}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="pt-2 text-center text-xs text-muted-foreground">
          Már van hozzáférésed?{" "}
          <Link href="/login" className="underline underline-offset-2 hover:text-foreground">
            Belépés
          </Link>
        </p>
      </div>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ctaLabel}</DialogTitle>
            <DialogDescription>Add meg az elérhetőségeidet, és visszahívunk a részletekkel.</DialogDescription>
          </DialogHeader>

          {contactSent ? (
            <Alert>
              <AlertDescription>
                Köszönjük! Hamarosan felvesszük veled a kapcsolatot.
                <div className="mt-4">
                  <Button type="button" onClick={closeContactDialog}>
                    Rendben
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <form className="space-y-4" onSubmit={handleContactSubmit}>
              <div className="space-y-2">
                <Label htmlFor="contact-name">Név</Label>
                <Input
                  id="contact-name"
                  value={contact.name}
                  onChange={(event) => setContact((previous) => ({ ...previous, name: event.target.value }))}
                  placeholder="Teljes név"
                  required
                />
                {contactErrors.name ? <p className="text-sm text-destructive">{contactErrors.name}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contact.email}
                  onChange={(event) => setContact((previous) => ({ ...previous, email: event.target.value }))}
                  placeholder="pelda@email.hu"
                  required
                />
                {contactErrors.email ? <p className="text-sm text-destructive">{contactErrors.email}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-phone">Telefonszám</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  value={contact.phone}
                  onChange={(event) => setContact((previous) => ({ ...previous, phone: event.target.value }))}
                  placeholder="+36 30 123 4567"
                  required
                />
                {contactErrors.phone ? <p className="text-sm text-destructive">{contactErrors.phone}</p> : null}
              </div>

              {contactError ? (
                <Alert variant="destructive">
                  <AlertDescription>{contactError}</AlertDescription>
                </Alert>
              ) : null}

              <Button className="w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Küldés..." : "Visszahívást kérek"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
