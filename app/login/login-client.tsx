"use client"

import type { FormEvent } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  from?: string
}

export default function LoginClient({ from }: Props) {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, code }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(payload?.message ?? "Sikertelen belépés.")
        return
      }

      const target = from && from.startsWith("/") ? from : "/"
      router.replace(target)
    } catch {
      setError("Sikertelen belépés. Próbáld újra.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 md:py-14">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Dinamikus Megtakarítás Kalkulátor</p>
            <h1 className="text-2xl font-semibold">Belépés</h1>
          </div>
          <div className="rounded-full border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
            Megtakarítás Számláló
          </div>
        </header>

        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Hozzáférés a kalkulátorhoz</CardTitle>
            <CardDescription>Add meg a felhasználóneved és a belépési kódot.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username">Felhasználónév</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="pl. admin"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Belépési kód</Label>
                <Input
                  id="code"
                  type="password"
                  autoComplete="current-password"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="••••"
                  required
                />
              </div>

              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <CardFooter className="px-0">
                <Button type="submit" className="w-full" disabled={isLoading || !username || !code}>
                  {isLoading ? "Beléptetés..." : "Belépés"}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

