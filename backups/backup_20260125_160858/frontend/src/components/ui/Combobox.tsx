'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'

interface ComboboxOption {
  value: string | number
  label: string
  subLabel?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string | number
  onChange: (value: string | number) => void
  placeholder?: string
  label?: string
  required?: boolean
  disabled?: boolean
}

export default function Combobox({ 
  options, 
  value, 
  onChange, 
  placeholder = 'בחר...', 
  label,
  required = false,
  disabled = false
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter options based on search
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.subLabel?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get selected option
  const selectedOption = options.find(opt => opt.value.toString() === value.toString())

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSelect = (option: ComboboxOption) => {
    onChange(option.value)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      
      <div ref={containerRef} className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-4 py-2 text-right border rounded-lg 
            flex items-center justify-between gap-2
            transition-colors
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-blue-500'}
            ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}
            ${!selectedOption && !isOpen ? 'text-gray-400' : 'text-gray-900'}
          `}
        >
          <div className="flex-1 text-right truncate">
            {selectedOption ? (
              <div>
                <div className="font-medium">{selectedOption.label}</div>
                {selectedOption.subLabel && (
                  <div className="text-xs text-gray-500">{selectedOption.subLabel}</div>
                )}
              </div>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {selectedOption && !disabled && (
              <X 
                className="w-4 h-4 text-gray-400 hover:text-gray-600"
                onClick={handleClear}
              />
            )}
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="חפש..."
                  className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Options List */}
            <div className="overflow-y-auto max-h-64">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    className={`
                      w-full px-4 py-2 text-right hover:bg-blue-50 transition-colors
                      ${option.value.toString() === value.toString() ? 'bg-blue-100' : ''}
                    `}
                  >
                    <div className="font-medium text-gray-900">{option.label}</div>
                    {option.subLabel && (
                      <div className="text-xs text-gray-500 mt-0.5">{option.subLabel}</div>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  לא נמצאו תוצאות
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
