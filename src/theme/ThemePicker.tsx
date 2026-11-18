import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { cx } from '../lib/cx'
import { Icon } from '../components/Icon/Icon'
import { Popover } from '../components/Popover/Popover'
import { useTheme } from './ThemeProvider'
import styles from './ThemePicker.module.css'

export function ThemePicker() {
  const { theme, definition, themes, setTheme } = useTheme()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const titleId = useId()
  const [open, setOpen] = useState(false)

  const selectedIndex = themes.findIndex((item) => item.key === theme)

  const close = (restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => {
      optionRefs.current[selectedIndex]?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [open, selectedIndex])

  const handleOptionKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      nextIndex = (index + 1) % themes.length
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + themes.length) % themes.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = themes.length - 1
    }

    if (nextIndex === null) return
    event.preventDefault()
    const next = themes[nextIndex]
    setTheme(next.key)
    optionRefs.current[nextIndex]?.focus()
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Elegir tema: ${definition.label}`}
        title={`Elegir tema · actual: ${definition.label}`}
        onClick={() => (open ? close(true) : setOpen(true))}
      >
        <span className={styles.triggerSwatches} aria-hidden="true">
          <i style={{ backgroundColor: definition.swatches[0] }} />
          <i style={{ backgroundColor: definition.swatches[1] }} />
          <i style={{ backgroundColor: definition.swatches[3] }} />
        </span>
        <span className={styles.triggerLabel}>{definition.label}</span>
        <Icon
          name="chevron-down"
          size="xs"
          className={cx(styles.triggerChevron, open && styles.triggerChevronOpen)}
        />
      </button>

      <Popover
        open={open}
        anchorRef={triggerRef}
        onClose={close}
        align="end"
        role="dialog"
        ariaLabelledby={titleId}
        className={styles.menu}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.title} id={titleId}>
              Temas del diario
            </p>
            <p className={styles.subtitle}>Otra tinta, el mismo invierno.</p>
          </div>
          <button
            type="button"
            className={styles.close}
            aria-label="Cerrar selector de temas"
            onClick={() => close(true)}
          >
            <Icon name="close" size="sm" />
          </button>
        </header>

        <div className={styles.grid} role="radiogroup" aria-label="Temas disponibles">
          {themes.map((item, index) => {
            const selected = item.key === theme
            return (
              <button
                key={item.key}
                ref={(node) => {
                  optionRefs.current[index] = node
                }}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                data-selected={selected ? 'true' : undefined}
                className={styles.option}
                onClick={() => setTheme(item.key)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
              >
                <span className={styles.swatches} aria-hidden="true">
                  {item.swatches.map((color) => (
                    <i key={color} style={{ backgroundColor: color }} />
                  ))}
                </span>
                <span className={styles.name}>{item.label}</span>
                <Icon name="check" size="xs" className={styles.check} />
                <span className={styles.meta}>{item.meta}</span>
              </button>
            )
          })}
        </div>

        <p className={styles.foot}>
          <span className={styles.diamond} aria-hidden="true" />
          La tinta cambia. El invierno no.
        </p>
      </Popover>
    </>
  )
}
