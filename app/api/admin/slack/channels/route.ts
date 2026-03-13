import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/utils/auth-utils'

export async function GET(req: NextRequest) {
  try {
    await verifyAdmin(req)

    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token') || process.env.SLACK_BOT_TOKEN

    if (!token) {
      return NextResponse.json(
        { error: 'Token Slack manquant (paramètre token ou SLACK_BOT_TOKEN)' },
        { status: 400 }
      )
    }

    const channels: { id: string; name: string; is_private: boolean; num_members: number }[] = []
    let cursor: string | undefined

    // Pagination Slack (max 1000 par page)
    do {
      const params = new URLSearchParams({
        types: 'public_channel,private_channel',
        limit: '1000',
        exclude_archived: 'true',
      })
      if (cursor) params.set('cursor', cursor)

      const res = await fetch(`https://slack.com/api/conversations.list?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (!data.ok) {
        return NextResponse.json({ error: data.error ?? 'Erreur Slack API' }, { status: 400 })
      }

      for (const ch of data.channels ?? []) {
        channels.push({
          id: ch.id,
          name: ch.name,
          is_private: ch.is_private,
          num_members: ch.num_members ?? 0,
        })
      }

      cursor = data.response_metadata?.next_cursor || undefined
    } while (cursor)

    channels.sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ channels, total: channels.length })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
