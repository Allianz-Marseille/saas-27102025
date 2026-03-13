'use client'

import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
import { Agency, CDC, TrelloConfig } from './types'
import { getCoverageStatus } from './validators'
import { FIRESTORE_DOC_PATH } from './constants'

function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function useTrelloConfig() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!db) {
      setLoading(false)
      return
    }

    const ref = doc(db, FIRESTORE_DOC_PATH)
    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        const data = snap.data() as TrelloConfig
        setAgencies(data.agencies ?? [])
      } else {
        setAgencies([])
      }
      setLoading(false)
    })

    return () => unsub()
  }, [])

  async function saveAgencies(updated: Agency[]) {
    if (!db) return
    const ref = doc(db, FIRESTORE_DOC_PATH)
    await setDoc(ref, { agencies: updated }, { merge: true })
  }

  async function addAgency(data: { code: string; name: string }) {
    const newAgency: Agency = {
      id: generateId(),
      code: data.code.toUpperCase(),
      name: data.name,
      cdc: [],
    }
    const updated = [...agencies, newAgency]
    setAgencies(updated) // optimistic
    await saveAgencies(updated)
    return newAgency
  }

  async function updateAgency(id: string, data: Partial<Pick<Agency, 'code' | 'name'>>) {
    const updated = agencies.map(a =>
      a.id === id
        ? { ...a, ...data, code: data.code ? data.code.toUpperCase() : a.code }
        : a
    )
    setAgencies(updated)
    await saveAgencies(updated)
  }

  async function deleteAgency(id: string) {
    const updated = agencies.filter(a => a.id !== id)
    setAgencies(updated)
    await saveAgencies(updated)
  }

  async function addCdc(agencyId: string, data: Omit<CDC, 'id'>) {
    const newCdc: CDC = { ...data, id: generateId() }
    const updated = agencies.map(a =>
      a.id === agencyId ? { ...a, cdc: [...a.cdc, newCdc] } : a
    )
    setAgencies(updated)
    await saveAgencies(updated)
    return newCdc
  }

  async function updateCdc(agencyId: string, cdcId: string, data: Partial<CDC>) {
    const updated = agencies.map(a =>
      a.id === agencyId
        ? { ...a, cdc: a.cdc.map(c => (c.id === cdcId ? { ...c, ...data } : c)) }
        : a
    )
    setAgencies(updated)
    await saveAgencies(updated)
  }

  async function deleteCdc(agencyId: string, cdcId: string) {
    const updated = agencies.map(a =>
      a.id === agencyId ? { ...a, cdc: a.cdc.filter(c => c.id !== cdcId) } : a
    )
    setAgencies(updated)
    await saveAgencies(updated)
  }

  return {
    agencies,
    loading,
    addAgency,
    updateAgency,
    deleteAgency,
    addCdc,
    updateCdc,
    deleteCdc,
    getCoverageStatus,
  }
}
