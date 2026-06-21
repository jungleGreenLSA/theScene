'use client'

import { useState } from 'react'

interface Props {
  url: string
  title?: string
  text?: string
  label?: string
  small?: boolean
}

export default function ShareButton({ url, title, text, label = 'Share', small = false }: Props) {
  const [copied, setCopied] = useState(false)
  const [fail, setFail] = useState(false)

  const absolute = url.startsWith('http') ? url : (typeof window !== 'undefined' ? `${window.location.origin}${url}` : url)

  const share = async () => {
    setFail(false)
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try { await navigator.share({ url: absolute, title, text }); return }
      catch { /* user cancelled; fall through to clipboard */ }
    }
    try {
      await navigator.clipboard.writeText(absolute)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setFail(true)
      setTimeout(() => setFail(false), 3000)
    }
  }

  const padding = small ? '6px 12px' : '8px 14px'
  const fontSize = small ? '11px' : '12px'

  return (
    <button
      onClick={share}
      style={{
        padding,
        borderRadius: '6px',
        background: 'rgba(45,212,191,0.08)',
        border: '1px solid rgba(45,212,191,0.25)',
        color: copied ? '#2dd4bf' : '#9ca3af',
        fontSize,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
        minHeight: '44px',
        transition: 'color 0.15s, border-color 0.15s',
      }}
    >
      {copied ? '✓ Link copied' : fail ? 'Copy failed' : `🔗 ${label}`}
    </button>
  )
}
