import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/utils/auth-utils'

export async function GET(req: NextRequest) {
  try {
    await verifyAdmin(req)
  } catch {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const boardId = searchParams.get('boardId')
  const apiKey = process.env.TRELLO_API_KEY
  const token = process.env.TRELLO_TOKEN

  if (!boardId) {
    return NextResponse.json({ error: 'Paramètre manquant : boardId' }, { status: 400 })
  }
  if (!apiKey || !token) {
    return NextResponse.json({ error: 'TRELLO_API_KEY ou TRELLO_TOKEN manquant dans les variables d\'environnement' }, { status: 500 })
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
