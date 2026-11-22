import { useEffect, useRef, useState, type FormEvent } from 'react'
import { readTags } from '../../lib/tags'
import { Button } from '../Button/Button'
import { TagField } from '../TagField/TagField'
import { Textarea } from '../Textarea/Textarea'
import { TextInput } from '../TextInput/TextInput'
import styles from './TaskEditor.module.css'

/** The fields the editor reads; both `Task` and `QuestTask` fit it. */
export interface TaskEditorValue {
  title: string
  note?: string
  tags?: string[]
}

/** The fields the editor owns; the rest of the task is read-only. */
export interface TaskUpdate {
  title: string
  note?: string
  tags?: string[]
}

export interface TaskEditorProps {
  task: TaskEditorValue
  /** The shared catalogue offered by the tag picker. */
  tagOptions: readonly string[]
  onSave: (update: TaskUpdate) => void
  onCancel: () => void
}

const MAX_TITLE = 120
const MAX_NOTE = 280

/**
 * The edit form shared by the daily list and the route. It always sits inside
 * a centred dialog, so it does not move the container; the focus lands on the
 * title in the next frame, once the overlay has been mounted.
 */
export function TaskEditor({
  task,
  tagOptions,
  onSave,
  onCancel,
}: TaskEditorProps) {
  const [title, setTitle] = useState(task.title)
  const [tags, setTags] = useState<string[]>(() => [...(task.tags ?? [])])
  const [note, setNote] = useState(task.note ?? '')
  const [titleError, setTitleError] = useState('')
  const form = useRef<HTMLFormElement>(null)

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      form.current?.querySelector<HTMLInputElement>('input')?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  /* A refused save keeps the focus on the field that has to change. */
  const focusTitle = () => {
    form.current?.querySelector<HTMLInputElement>('[name="title"]')?.focus()
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) {
      setTitleError('Write a title first.')
      focusTitle()
      return
    }

    const cleanNote = note.trim()
    onSave({
      title: cleanTitle,
      note: cleanNote || undefined,
      tags: readTags(tags),
    })
  }

  return (
    <form
      ref={form}
      className={styles.form}
      aria-label={`Edit “${task.title}”`}
      onSubmit={submit}
      noValidate
    >
      <TextInput
        name="title"
        label="Title"
        value={title}
        error={titleError || undefined}
        autoComplete="off"
        maxLength={MAX_TITLE}
        onChange={(event) => {
          setTitle(event.target.value)
          if (titleError) setTitleError('')
        }}
      />
      <TagField options={tagOptions} value={tags} onChange={setTags} />
      <Textarea
        label="Description"
        optional
        value={note}
        rows={3}
        maxLength={MAX_NOTE}
        showCount
        autoGrow
        onChange={(event) => setNote(event.target.value)}
      />
      <div className={styles.actions}>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Save
        </Button>
      </div>
    </form>
  )
}
