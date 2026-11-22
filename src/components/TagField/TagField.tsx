import { useState, type KeyboardEvent } from 'react'
import {
  MAX_TAGS,
  MAX_TAG_LENGTH,
  mergeTagOptions,
  normalizeTag,
  tagKey,
} from '../../lib/tags'
import { Button } from '../Button/Button'
import { Checkbox, CheckboxGroup } from '../Checkbox/Checkbox'
import { TextInput } from '../TextInput/TextInput'
import styles from './TagField.module.css'

export interface TagFieldProps {
  /** The global catalogue: every tag already in use across the journal. */
  options: readonly string[]
  value: readonly string[]
  onChange: (tags: string[]) => void
  label?: string
  max?: number
}

/**
 * A task's labels are picked, not typed. The global catalogue is a list of
 * checkboxes, so adding or removing a tag is one keystroke and the same
 * label is spelled the same way everywhere; a new tag is created on the side
 * and joins the catalogue as soon as the task is saved.
 */
export function TagField({
  options,
  value,
  onChange,
  label = 'Tags',
  max = MAX_TAGS,
}: TagFieldProps) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')

  /* A tag being created is visible at once, even before it joins the catalogue. */
  const known = mergeTagOptions(options, value)
  const selected = new Set(value.map(tagKey))
  const full = value.length >= max

  const toggle = (tag: string, checked: boolean) => {
    setError('')
    if (!checked) {
      const key = tagKey(tag)
      onChange(value.filter((item) => tagKey(item) !== key))
      return
    }
    if (full) {
      setError(`${max} tags at most.`)
      return
    }
    onChange([...value, tag])
  }

  const add = () => {
    const tag = normalizeTag(draft)
    if (!tag) {
      setError('Write a tag first.')
      return
    }
    if (tag.length > MAX_TAG_LENGTH) {
      setError(`Tags are ${MAX_TAG_LENGTH} characters at most.`)
      return
    }

    const key = tagKey(tag)
    const existing = known.find((item) => tagKey(item) === key)
    if (existing) {
      /* A duplicate selects the label instead of adding it twice. */
      if (!selected.has(key)) {
        if (full) {
          setError(`${max} tags at most.`)
          return
        }
        onChange([...value, existing])
      }
      setDraft('')
      setError('')
      return
    }

    if (full) {
      setError(`${max} tags at most.`)
      return
    }
    onChange([...value, tag])
    setDraft('')
    setError('')
  }

  /*
    Enter in the new-tag field adds a tag; it must not save the whole task.
    While an IME composes, Enter belongs to the candidate list.
  */
  const addOnEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return
    event.preventDefault()
    add()
  }

  return (
    <CheckboxGroup
      label={label}
      error={error || undefined}
      className={styles.group}
    >
      <div className={styles.options}>
        {known.map((tag) => {
          const key = tagKey(tag)
          const checked = selected.has(key)
          return (
            <Checkbox
              key={key}
              label={tag}
              checked={checked}
              disabled={!checked && full}
              onChange={(event) => toggle(tag, event.target.checked)}
            />
          )
        })}
      </div>
      <div className={styles.create}>
        <TextInput
          aria-label="New tag"
          placeholder="New tag…"
          value={draft}
          size="sm"
          maxLength={MAX_TAG_LENGTH}
          autoComplete="off"
          onChange={(event) => {
            setDraft(event.target.value)
            if (error) setError('')
          }}
          onKeyDown={addOnEnter}
        />
        <Button type="button" variant="secondary" size="sm" onClick={add}>
          Add tag
        </Button>
      </div>
      <p className={styles.count}>
        {value.length} of {max} labels
      </p>
    </CheckboxGroup>
  )
}
