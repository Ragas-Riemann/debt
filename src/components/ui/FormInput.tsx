'use client'

import { Input } from './input'
import { Label } from './label'
import { cn } from '@/lib/utils'
import { forwardRef, ReactNode, useId } from 'react'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  containerClassName?: string
  rightIcon?: ReactNode
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, required, containerClassName, className, id, rightIcon, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id || generatedId
    
    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <Label 
            htmlFor={inputId} 
            className={cn(
              'text-sm font-medium',
              error && 'text-destructive'
            )}
          >
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
        )}
        <div className="relative">
          <Input
            id={inputId}
            ref={ref}
            className={cn(
              error && 'border-destructive focus:ring-destructive',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'
