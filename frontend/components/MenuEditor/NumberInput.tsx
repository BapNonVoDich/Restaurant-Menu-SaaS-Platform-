'use client'

import { useState, useEffect } from 'react'

interface NumberInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  min?: number
  max?: number
  allowSpecialValues?: boolean // For values like "auto", "inherit", "none"
}

export default function NumberInput({
  value,
  onChange,
  placeholder = '0',
  className = '',
  min,
  max,
  allowSpecialValues = false
}: NumberInputProps) {
  const [numberValue, setNumberValue] = useState<string>('')
  const [unit, setUnit] = useState<'px' | '%'>('px')
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!isEditing) {
      // Check for special values first
      if (allowSpecialValues && value && ['auto', 'inherit', 'none', 'initial', 'unset'].includes(value)) {
        setNumberValue(value)
        setUnit('px')
        return
      }
      
      // Parse value: "10px" -> numberValue: "10", unit: "px"
      if (value) {
        const match = value.match(/^([\d.]+)(px|%)?$/)
        if (match) {
          setNumberValue(match[1])
          setUnit((match[2] as 'px' | '%') || 'px')
        } else {
          setNumberValue(value)
          setUnit('px')
        }
      } else {
        setNumberValue('')
        setUnit('px')
      }
    }
  }, [value, isEditing, allowSpecialValues])

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setIsEditing(true)
    
    // Allow empty
    if (newValue === '') {
      setNumberValue('')
      onChange('')
      return
    }
    
    // Check for special values
    if (allowSpecialValues && ['auto', 'inherit', 'none', 'initial', 'unset'].includes(newValue)) {
      setNumberValue(newValue)
      onChange(newValue)
      return
    }
    
    // Allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(newValue)) {
      setNumberValue(newValue)
      const num = parseFloat(newValue)
      if (!isNaN(num)) {
        const clampedValue = min !== undefined && num < min ? min : max !== undefined && num > max ? max : num
        onChange(`${clampedValue}${unit}`)
      }
    }
  }
  
  const handleBlur = () => {
    setIsEditing(false)
    // Ensure value is properly formatted on blur
    if (numberValue && !isNaN(parseFloat(numberValue))) {
      const num = parseFloat(numberValue)
      const clampedValue = min !== undefined && num < min ? min : max !== undefined && num > max ? max : num
      onChange(`${clampedValue}${unit}`)
    } else if (numberValue === '') {
      onChange('')
    }
  }

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = e.target.value as 'px' | '%'
    setUnit(newUnit)
    if (numberValue) {
      const num = parseFloat(numberValue)
      if (!isNaN(num)) {
        onChange(`${num}${newUnit}`)
      }
    }
  }

  const isSpecialValue = allowSpecialValues && ['auto', 'inherit', 'none', 'initial', 'unset'].includes(numberValue)

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        value={numberValue}
        onChange={handleNumberChange}
        onBlur={handleBlur}
        onFocus={() => setIsEditing(true)}
        placeholder={placeholder}
        className={`flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm ${className}`}
      />
      {!isSpecialValue && (
        <select
          value={unit}
          onChange={handleUnitChange}
          className="px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-white"
        >
          <option value="px">px</option>
          <option value="%">%</option>
        </select>
      )}
    </div>
  )
}
