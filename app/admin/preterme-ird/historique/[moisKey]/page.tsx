"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HistoriqueIrdRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace("/admin/preterme-ird") }, [router])
  return null
}
