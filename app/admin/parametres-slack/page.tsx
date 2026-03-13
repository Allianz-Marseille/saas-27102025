'use client'

import { useState } from 'react'
import { Hash, Lock, Loader2, RefreshCw, Search, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

interface SlackChannel {
  id: string
  name: string
  is_private: boolean
  num_members: number
}

export default function ParametresSlackPage() {
  const [token, setToken] = useState('')
  const [channels, setChannels] = useState<SlackChannel[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [total, setTotal] = useState<number | null>(null)

  async function fetchChannels() {
    setLoading(true)
    try {
      const params = token ? `?token=${encodeURIComponent(token)}` : ''
      const res = await fetch(`/api/admin/slack/channels${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erreur inconnue')
      setChannels(data.channels)
      setTotal(data.total)
      toast.success(`${data.total} channels récupérés`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  async function copyId(id: string) {
    await navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const filtered = channels.filter(ch =>
    ch.name.toLowerCase().includes(search.toLowerCase()) ||
    ch.id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 p-6 min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-emerald-600/20 flex items-center justify-center">
          <Hash className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-white">Paramètres Slack</h1>
          <p className="text-xs text-slate-400">Récupérer les IDs de toutes les chaînes Slack</p>
        </div>
      </div>

      {/* Fetch panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <p className="text-sm font-medium text-slate-300">Bot Token Slack</p>
        <div className="flex gap-3">
          <input
            value={token}
            onChange={e => setToken(e.target.value)}
            type="password"
            placeholder="xoxb-… (laisser vide si SLACK_BOT_TOKEN est dans .env)"
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={fetchChannels}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/20 text-emerald-400 text-sm hover:bg-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {loading ? 'Chargement…' : 'Télécharger les chaînes'}
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Le token n'est jamais sauvegardé. Crée un Bot Token sur{' '}
          <span className="text-slate-400 font-mono">api.slack.com/apps</span> avec le scope{' '}
          <span className="text-slate-400 font-mono">channels:read</span> +{' '}
          <span className="text-slate-400 font-mono">groups:read</span>.
        </p>
      </div>

      {/* Results */}
      {channels.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Search bar */}
          <div className="p-4 border-b border-slate-800 flex items-center gap-3">
            <Search className="h-4 w-4 text-slate-500 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou ID…"
              className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            <span className="text-xs text-slate-500 shrink-0">
              {filtered.length} / {total}
            </span>
          </div>

          {/* List */}
          <div className="divide-y divide-slate-800 max-h-[60vh] overflow-y-auto">
            {filtered.map(ch => (
              <div
                key={ch.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors group"
              >
                {ch.is_private ? (
                  <Lock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                ) : (
                  <Hash className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                )}
                <span className="flex-1 text-sm text-white truncate">{ch.name}</span>
                <span className="text-xs text-slate-500 font-mono shrink-0">{ch.num_members} membres</span>
                <button
                  onClick={() => copyId(ch.id)}
                  className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors"
                >
                  {copiedId === ch.id ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  {ch.id}
                </button>
              </div>
            ))}

            {filtered.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-8">Aucune chaîne trouvée</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
