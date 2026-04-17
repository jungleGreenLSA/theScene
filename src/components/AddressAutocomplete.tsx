'use client'

import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps, parsePlace, ParsedAddress } from '@/lib/googleMaps'

interface Props {
  onChange: (address: ParsedAddress) => void
  defaultValue?: string
  placeholder?: string
  types?: string[]
  required?: boolean
}

export default function AddressAutocomplete({
  onChange,
  defaultValue = '',
  placeholder = 'Start typing an address...',
  types = ['address'],
  required = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [warning, setWarning] = useState('')

  useEffect(() => {
    let ac: google.maps.places.Autocomplete | null = null

    loadGoogleMaps()
      .then(() => {
        if (!inputRef.current || !window.google) return
        ac = new window.google.maps.places.Autocomplete(inputRef.current, {
          types,
          componentRestrictions: { country: 'us' },
          fields: ['address_components', 'formatted_address', 'geometry'],
        })
        ac.addListener('place_changed', () => {
          const place = ac!.getPlace()
          if (!place.geometry) return
          const parsed = parsePlace(place)
          onChange(parsed)
          if (inputRef.current) inputRef.current.value = parsed.formatted
        })
      })
      .catch((err) => setWarning(err.message || 'Maps unavailable'))

    return () => {
      if (ac && window.google) window.google.maps.event.clearInstanceListeners(ac)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="input"
        required={required}
        autoComplete="off"
      />
      {warning && <p style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px' }}>⚠ {warning} — fill fields manually below.</p>}
    </>
  )
}
