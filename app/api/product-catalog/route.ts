import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth-session"
import {
  createProductVersion,
  listProductCatalog,
} from "@/lib/product-catalog/repository"
import {
  productCatalogCreateSchema,
  productCatalogListQuerySchema,
} from "@/lib/product-catalog/schema"

export async function GET(request: NextRequest) {
  const session = getSessionUser(request)
  if (!session) {
    return NextResponse.json({ message: "Nincs jogosultság." }, { status: 401 })
  }

  const parsed = productCatalogListQuerySchema.safeParse({
    insurer: request.nextUrl.searchParams.get("insurer") ?? undefined,
    includeInactive: request.nextUrl.searchParams.get("includeInactive") ?? undefined,
    productValue: request.nextUrl.searchParams.get("productValue") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Hibás lekérdezési paraméterek.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    )
  }

  try {
    const rows = await listProductCatalog(parsed.data)
    return NextResponse.json({ items: rows })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lekérdezési hiba."
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = getSessionUser(request)
  if (!session || !session.isAdmin) {
    return NextResponse.json({ message: "Nincs jogosultság." }, { status: 401 })
  }

  let payloadRaw: unknown
  try {
    payloadRaw = await request.json()
  } catch {
    return NextResponse.json({ message: "Hibás kérés." }, { status: 400 })
  }

  const parsed = productCatalogCreateSchema.safeParse(payloadRaw)
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Hiányzó vagy hibás mezők.",
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    )
  }

  try {
    const created = await createProductVersion({
      ...parsed.data,
      createdBy: parsed.data.createdBy ?? session.userId,
    })
    return NextResponse.json({ item: created }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mentési hiba."
    return NextResponse.json({ message }, { status: 400 })
  }
}
