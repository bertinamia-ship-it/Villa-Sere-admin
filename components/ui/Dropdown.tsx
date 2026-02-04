'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Portal } from './Portal'

interface DropdownProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'left' | 'right'
  className?: string
}

export function Dropdown({ trigger, children, align = 'left', className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          setIsOpen(false)
        }
      })
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && triggerRef.current && dropdownRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const dropdown = dropdownRef.current
      
      if (align === 'right') {
        dropdown.style.right = '0'
        dropdown.style.left = 'auto'
      } else {
        dropdown.style.left = '0'
        dropdown.style.right = 'auto'
      }
      
      dropdown.style.top = `${triggerRect.height + 4}px`
    }
  }, [isOpen, align])

  return (
    <div className={`relative ${className}`}>
      <div
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer"
      >
        {trigger}
      </div>
      {isOpen && (
        <Portal>
          <div
            ref={dropdownRef}
            className="absolute z-[95] mt-1 w-56 rounded-lg bg-white border border-gray-200/60 shadow-lg py-1"
            style={{
              position: 'absolute',
              top: triggerRef.current ? triggerRef.current.getBoundingClientRect().bottom + 4 : 0,
              left: align === 'right' ? 'auto' : triggerRef.current ? triggerRef.current.getBoundingClientRect().left : 0,
              right: align === 'right' ? window.innerWidth - (triggerRef.current ? triggerRef.current.getBoundingClientRect().right : 0) : 'auto',
            }}
          >
            {children}
          </div>
        </Portal>
      )}
    </div>
  )
}


