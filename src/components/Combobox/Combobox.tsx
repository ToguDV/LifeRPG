import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cx } from '../../lib/cx'
import { useControllableState } from '../../lib/useControllableState'
import { Field, getFieldLabelId, getFieldMessageIds } from '../Field/Field'
import { Icon } from '../Icon/Icon'
import { Popover } from '../Popover/Popover'
import styles from './Combobox.module.css'

export interface ComboboxOption {
  value: string
  label: string
  description?: string
  icon?: ReactNode
  disabled?: boolean
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  onInputChange?: (query: string) => void
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

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function firstEnabled(options: ComboboxOption[]): number {
  return options.findIndex((option) => !option.disabled)
}

export function Combobox({
  options,
  value,
  defaultValue = '',
  onChange,
  onInputChange,
  label,
  hint,
  error,
  optional,
  labelAside,
  placeholder = 'Search or type…',
  size = 'md',
  disabled,
  required,
  name,
  id,
  leadingIcon,
  className,
  fieldClassName,
}: ComboboxProps) {
  const autoId = useId()
  const fieldId = id ?? `combobox-${autoId}`
  const labelId = getFieldLabelId(fieldId)
  const listboxId = `${fieldId}-listbox`
  const inputRef = useRef<HTMLInputElement>(null)
  const controlRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLLIElement | null>>([])

  const [current, setCurrent] = useControllableState({
    value,
    defaultValue,
    onChange,
  })
  const selected = options.find((option) => option.value === current)
  const selectedLabel = selected?.label ?? ''
  const hasLabel = Boolean(label)
  /*
    Without a `Field` label the input is named by its placeholder, so the
    popup inherits that text instead of pointing at an id that is not there.
  */
  const popupName = placeholder || 'Options'

  const [query, setQuery] = useState(selectedLabel)
  const [open, setOpen] = useState(false)
  const [filtering, setFiltering] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const filtered = filtering
    ? options.filter((option) => normalize(option.label).includes(normalize(query)))
    : options

  const messageId = getFieldMessageIds(fieldId, { hint, error }).join(' ') || undefined

  useEffect(() => {
    if (!open) setQuery(selectedLabel)
  }, [open, selectedLabel])

  const openMenu = useCallback(
    (preferredIndex?: number) => {
      if (disabled) return
      setOpen(true)
      setFiltering(false)
      setQuery(selectedLabel)
      const selectedIndex = options.findIndex((option) => option.value === current)
      const next =
        preferredIndex ??
        (selectedIndex >= 0 && !options[selectedIndex]?.disabled
          ? selectedIndex
          : firstEnabled(options))
      setActiveIndex(next)
    },
    [current, disabled, options, selectedLabel],
  )

  const close = useCallback(
    (restoreFocus = true) => {
      setOpen(false)
      setFiltering(false)
      setActiveIndex(-1)
      setQuery(selectedLabel)
      if (restoreFocus) inputRef.current?.focus()
    },
    [selectedLabel],
  )

  const selectOption = (index: number) => {
    const option = filtered[index]
    if (!option || option.disabled) return
    setCurrent(option.value)
    setQuery(option.label)
    setFiltering(false)
    setOpen(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const moveActive = (direction: 1 | -1) => {
    if (!filtered.length) return
    const start = activeIndex >= 0 ? activeIndex : direction === 1 ? -1 : filtered.length
    for (let step = 1; step <= filtered.length; step += 1) {
      const index = (start + step * direction + filtered.length) % filtered.length
      if (!filtered[index]?.disabled) {
        setActiveIndex(index)
        return
      }
    }
  }

  useLayoutEffect(() => {
    if (!open || activeIndex < 0) return
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  useEffect(() => {
    if (!open) return
    if (activeIndex >= filtered.length) setActiveIndex(firstEnabled(filtered))
  }, [activeIndex, filtered, open])

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value
    setQuery(nextQuery)
    setFiltering(true)
    onInputChange?.(nextQuery)
    setOpen(true)

    const matches = options.filter((option) =>
      normalize(option.label).includes(normalize(nextQuery)),
    )
    const firstMatch = matches.findIndex((option) => !option.disabled)
    setActiveIndex(firstMatch)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
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

    if (event.key === 'Enter') {
      if (!open) {
        event.preventDefault()
        openMenu()
        return
      }
      event.preventDefault()
      const index = activeIndex >= 0 ? activeIndex : firstEnabled(filtered)
      if (index >= 0) selectOption(index)
      return
    }

    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault()
        close(true)
      }
      return
    }

    if (event.key === 'Tab') {
      if (open) close(false)
    }
  }

  const activeOption = open && activeIndex >= 0 ? filtered[activeIndex] : undefined
  const showClear = query.length > 0 || current.length > 0

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
      <div
        ref={controlRef}
        className={cx(
          styles.control,
          styles[size],
          open && styles.open,
          error && styles.invalid,
          disabled && styles.disabled,
          className,
        )}
      >
        {leadingIcon ? (
          <span className={styles.leading} aria-hidden="true">
            {leadingIcon}
          </span>
        ) : null}
        <input
          ref={inputRef}
          id={fieldId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-activedescendant={
            activeOption ? `${fieldId}-option-${activeIndex}` : undefined
          }
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          value={query}
          onChange={handleInput}
          onFocus={() => {
            if (!open) openMenu()
          }}
          onClick={() => {
            if (!open) openMenu()
          }}
          onKeyDown={handleKeyDown}
          className={styles.input}
        />
        {showClear && !disabled ? (
          <button
            type="button"
            className={styles.clear}
            aria-label="Clear selection"
            onClick={() => {
              setCurrent('')
              setQuery('')
              setFiltering(true)
              setOpen(true)
              setActiveIndex(-1)
              onInputChange?.('')
              window.requestAnimationFrame(() => inputRef.current?.focus())
            }}
          >
            <Icon name="close" size="xs" />
          </button>
        ) : null}
        <span
          className={cx(styles.chevron, open && styles.chevronOpen)}
          aria-hidden="true"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => (open ? close(true) : openMenu())}
        >
          <Icon name="chevron-down" size="sm" />
        </span>
      </div>

      {name ? <input type="hidden" name={name} value={current} /> : null}

      <Popover
        open={open}
        anchorRef={controlRef}
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
          {filtered.map((option, index) => {
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
                onClick={() => selectOption(index)}
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
        {!filtered.length ? <p className={styles.empty}>No matches.</p> : null}
      </Popover>
    </Field>
  )
}
