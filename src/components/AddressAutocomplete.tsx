'use client'

import { useEffect, useRef, useState } from 'react'
import { searchAddresses, ParsedAddress } from '@/lib/mapbox'

interface Props {
  onChange: (address: ParsedAddress) => void
  defaultValue?: string
  placeholder?: string
  mode?: 'address' | 'city'
  required?: boolean
}

export default function AddressAutocomplete({
  onChange,
  defaultValue = '',
  placeholder = 'Start typing an address...',
  mode = 'address',
  required = false,
}: Props) {
  const [value, setValue] = useState(defaultValue)
  const [suggestions, setSuggestions] = useState<ParsedAddress[]>([])
  const [open, setOpen] = useState(false)
  const [warning, setWarning] = useState('')
  const debounceRef = useRef<number | null>(null)
  // Only search + open the dropdown after the user actively interacts
  // with the input. Prevents the initial defaultValue from auto-opening
  // the menu and prevents a pick() → setValue → useEffect from reopening
  // the menu immediately after a selection.
  const userInput = useRef(false)

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    if (!userInput.current) return
    if (value.trim().length < 3) { setSuggestions([]); setOpen(false); return }
    debounceRef.current = window.setTimeout(async () => {
      try {
        const results = await searchAddresses(value, mode)
        setSuggestions(results)
        setOpen(userInput.current && results.length > 0)
        setWarning('')
      } catch (e: any) {
        setWarning(e.message || 'Search unavailable')
      }
    }, 250)
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current) }
  }, [value, mode])

  const pick = (s: ParsedAddress) => {
    userInput.current = false
    setValue(s.formatted)
    setSuggestions([])
    setOpen(false)
    onChange(s)
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => { userInput.current = true; setValue(e.target.value) }}
        onFocus={() => { if (suggestions.length > 0 && userInput.current) setOpen(true) }}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
        placeholder={placeholder}
        className="input"
        required={required}
        autoComplete="off"
      />
      {warning && <p style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>{warning} — fill fields manually below.</p>}
      {open && suggestions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#12121e', border: '1px solid #d4d4d4', borderRadius: '8px', overflow: 'hidden', zIndex: 50, maxHeight: '280px', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(s)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', borderBottom: i < suggestions.length - 1 ? '1px solid #f5f5f5' : 'none', cursor: 'pointer', color: '#1a1a1a', fontSize: '13px' }}
            >
              {s.formatted}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
