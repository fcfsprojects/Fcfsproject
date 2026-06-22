'use client'

import { styles } from '@/lib/constants'

interface FormInputProps {
  label: string
  type?: string
  step?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function FormInput({ label, type = 'text', step, value, onChange, placeholder }: FormInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.input}
      />
    </div>
  )
}
