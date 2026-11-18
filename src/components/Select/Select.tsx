import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cx } from '../../lib/cx'
import { useControllableState } from '../../lib/useControllableState'
import { Field, getFieldLabelId, getFieldMessageIds } from '../Field/Field'
import { Icon } from '../Icon/Icon'
import { Popover } from '../Popover/Popover'
import styles from './Select.module.css'

export interface SelectOption {
  value: string
  label: string
  description?: string
  icon?: ReactNode
  disabled?: boolean
}

export interface SelectProps {
  options: SelectOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  optional?: boolean
  labelAside?: ReactNode
  placeholder?: string
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  required?: boolean
  name?: string
  id?: string
  leadingIcon?: ReactNode
  className?: string
  fieldClassName?: string
}

function firstEnabledIndex(options: SelectOption[], from = 0, direction = 1): number {
  if (!options.length) return -1
  for (let step = 0; step < options.length; step += 1) {
    const index = (from + step * direction + options.length) % options.length
    if (!options[index]?.disabled) return index
  }
  return -1
}

export function Select({
  options,
  value,
  defaultValue = '',
  onChange,
  label,
  hint,
  error,
  optional,
  labelAside,
  placeholder = 'Elige una opción',
  size = 'md',
  disabled,
  required,
  name,
  id,
  leadingIcon,
  className,
  fieldClassName,
}: SelectProps) {
  const autoId = useId()
  const fieldId = id ?? `select-${autoId}`
  const labelId = getFieldLabelId(fieldId)
  const listboxId = `${fieldId}-listbox`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<Array<HTMLLIElement | null>>([])
  const typeahead = useRef({ value: '', timer: 0 })

  const [current, setCurrent] = useControllableState({
    value,
    defaultValue,
    onChange,
  })
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const selectedIndex = options.findIndex((option) => option.value === current)
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined
  const hasLabel = Boolean(label)
  /*
    Without a `Field` label there is no label node to reference, so the popup
    inherits the visible value instead of pointing at an id that is not there.
  */
  const popupName = selected?.label || placeholder || 'Opciones'
  const messageId = getFieldMessageIds(fieldId, { hint, error }).join(' ') || undefined

  const close = useCallback(
    (restoreFocus = true) => {
      setOpen(false)
      setActiveIndex(-1)
      if (restoreFocus) triggerRef.current?.focus()
    },
    [],
  )

  const openMenu = (preferredIndex?: number) => {
    if (disabled) return
    const fallback = selectedIndex >= 0 ? selectedIndex : firstEnabledIndex(options)
    const next = preferredIndex ?? fallback
    setActiveIndex(next >= 0 && !options[next]?.disabled ? next : firstEnabledIndex(options))
    setOpen(true)
  }

  const selectIndex = (index: number) => {
    const option = options[index]
    if (!option || option.disabled) return
    setCurrent(option.value)
    close(true)
  }

  const moveActive = (direction: 1 | -1) => {
    if (!options.length) return
    const start = activeIndex >= 0 ? activeIndex : selectedIndex >= 0 ? selectedIndex : 0
    const next = firstEnabledIndex(options, start + direction, direction)
    if (next >= 0) setActiveIndex(next)
  }

  useLayoutEffect(() => {
    if (!open || activeIndex < 0) return
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  useEffect(() => {
    if (!open) return
    if (activeIndex >= options.length) setActiveIndex(firstEnabledIndex(options))
  }, [activeIndex, open, options])

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        openMenu()
        return
      }
      moveActive(event.key === 'ArrowDown' ? 1 : -1)
      return
    }

    if (event.key === 'Home' || event.key === 'End') {
      if (!open) return
      event.preventDefault()
      setActiveIndex(event.key === 'Home' ? firstEnabledIndex(options) : firstEnabledIndex(options, options.length - 1, -1))
      return
    }

    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault()
      if (!open) {
        openMenu()
      } else if (activeIndex >= 0) {
        selectIndex(activeIndex)
      } else {
        close(true)
      }
      return
    }

    if (event.key === 'Escape' && open) {
      event.preventDefault()
      close(true)
      return
    }

    if (event.key === 'Tab') {
      if (open) close(false)
      return
    }

    if (event.key.length === 1 && /\S/.test(event.key)) {
      typeahead.current.value += event.key.toLowerCase()
      window.clearTimeout(typeahead.current.timer)
      typeahead.current.timer = window.setTimeout(() => {
        typeahead.current.value = ''
      }, 600)

      const query = typeahead.current.value
      const match = options.findIndex(
        (option) => !option.disabled && option.label.toLowerCase().startsWith(query),
      )
      if (match >= 0) {
        if (!open) openMenu(match)
        else setActiveIndex(match)
      }
    }
  }

  const activeOption = open && activeIndex >= 0 ? options[activeIndex] : undefined

  return (
    <Field
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      optional={optional}
      labelAside={labelAside}
      className={fieldClassName}
    >
      <button
        ref={triggerRef}
        type="button"
        id={fieldId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={hasLabel ? undefined : popupName}
        aria-activedescendant={
          activeOption ? `${fieldId}-option-${activeIndex}` : undefined
        }
        aria-invalid={error ? true : undefined}
        aria-required={required || undefined}
        aria-describedby={messageId}
        disabled={disabled}
        className={cx(
          styles.trigger,
          styles[size],
          open && styles.open,
          error && styles.invalid,
          className,
        )}
        onClick={() => (open ? close(true) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
      >
        {selected?.icon ? (
          <span className={styles.leading} aria-hidden="true">
            {selected.icon}
          </span>
        ) : leadingIcon ? (
          <span className={styles.leading} aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}
        <span className={cx(styles.value, !selected && styles.placeholder)}>
          {selected?.label ?? placeholder}
        </span>
        <Icon
          name="chevron-down"
          size="sm"
          className={cx(styles.chevron, open && styles.chevronOpen)}
        />
      </button>

      {name ? <input type="hidden" name={name} value={current} /> : null}

      <Popover
        open={open}
        anchorRef={triggerRef}
        onClose={close}
        matchWidth
        className={styles.menu}
        role="region"
        ariaLabelledby={hasLabel ? labelId : undefined}
        ariaLabel={hasLabel ? undefined : popupName}
      >
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={hasLabel ? labelId : undefined}
          aria-label={hasLabel ? undefined : popupName}
          className={styles.listbox}
          tabIndex={-1}
        >
          {options.map((option, index) => {
            const isSelected = option.value === current
            const isActive = index === activeIndex
            return (
              // The listbox owns the keyboard through aria-activedescendant.
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <li
                key={option.value}
                ref={(node) => {
                  optionRefs.current[index] = node
                }}
                id={`${fieldId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                aria-disabled={option.disabled || undefined}
                data-active={isActive ? 'true' : undefined}
                data-selected={isSelected ? 'true' : undefined}
                data-disabled={option.disabled ? 'true' : undefined}
                className={styles.option}
                onPointerMove={() => {
                  if (!option.disabled) setActiveIndex(index)
                }}
                onClick={() => selectIndex(index)}
              >
                {option.icon ? (
                  <span className={styles.optionIcon} aria-hidden="true">
                    {option.icon}
                  </span>
                ) : (
                  <span className={styles.optionBullet} aria-hidden="true" />
                )}
                <span className={styles.optionText}>
                  <span className={styles.optionLabel}>{option.label}</span>
                  {option.description ? (
                    <span className={styles.optionDescription}>{option.description}</span>
                  ) : null}
                </span>
                {isSelected ? (
                  <Icon name="check" size="sm" className={styles.optionCheck} />
                ) : null}
              </li>
            )
          })}
        </ul>
        {!options.length ? <p className={styles.empty}>No hay opciones disponibles.</p> : null}
      </Popover>
    </Field>
  )
}
