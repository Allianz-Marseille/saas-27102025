import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/firebase/auth-server'

export async function GET(req: NextRequest) {
  try {
    await verifyAdmin(req)
  } catch {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const boardId = searchParams.get('boardId')
  const apiKey = searchParams.get('apiKey')
  const token = searchParams.get('token')

  if (!boardId || !apiKey || !token) {
    return NextResponse.json({ error: 'Paramètres manquants : boardId, apiKey, token' }, { status: 400 })
  }

  const url = `https://api.trello.com/1/boards/${boardId}/lists?fields=id,name,closed&key=${apiKey}&token=${token}`
  const res = await fetch(url)

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: `Trello API : ${res.status} — ${text}` }, { status: res.status })
  }

  const lists = await res.json()
  const open = lists.filter((l: { closed: boolean }) => !l.closed).map((l: { id: string; name: string }) => ({ id: l.id, name: l.name }))

  return NextResponse.json({ lists: open })
}
