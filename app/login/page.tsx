import LoginClient from "./login-client"

type Props = {
  searchParams?: Record<string, string | string[] | undefined>
}

export default function LoginPage({ searchParams }: Props) {
  const from = typeof searchParams?.from === "string" ? searchParams.from : undefined
  return <LoginClient from={from} />
}
