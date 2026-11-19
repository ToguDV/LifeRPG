import { useEffect, useState, type FormEvent } from 'react'
import { dateKey } from '../../lib/date'
import { Button } from '../Button/Button'
import { DatePicker } from '../DatePicker/DatePicker'
import { TextInput } from '../TextInput/TextInput'
import {
  parseDeadlineKey,
  type QuestNode,
  type QuestNodePatch,
} from './questline-model'
import styles from './QuestNodePanel.module.css'

export interface QuestNodeEditorProps {
  node: QuestNode
  editorId: string
  onUpdateNode: (patch: QuestNodePatch) => void
  /** Closes the editor after saving or cancelling. */
  onDone: () => void
}

/**
 * Inline milestone form. It mounts with the editor open, so there is no
 * stale draft to reset; a change from the outside still wins.
 */
export function QuestNodeEditor({
  node,
  editorId,
  onUpdateNode,
  onDone,
}: QuestNodeEditorProps) {
  const [draftTitle, setDraftTitle] = useState(node.title)
  const [draftDeadline, setDraftDeadline] = useState<Date | null>(() =>
    parseDeadlineKey(node.deadline),
  )
  const [titleError, setTitleError] = useState<string | null>(null)

  useEffect(() => {
    setDraftTitle(node.title)
    setDraftDeadline(parseDeadlineKey(node.deadline))
    setTitleError(null)
  }, [node.title, node.deadline])

  const cancelEditing = () => {
    setTitleError(null)
    onDone()
  }

  const submitNode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = draftTitle.trim()
    if (!title) {
      setTitleError('El hito necesita un nombre.')
      return
    }
    onUpdateNode({
      title,
      deadline: draftDeadline ? dateKey(draftDeadline) : null,
    })
    onDone()
  }

  return (
    <form id={editorId} className={styles.editor} onSubmit={submitNode} noValidate>
      <TextInput
        label="Nombre del hito"
        autoFocus
        value={draftTitle}
        onChange={(event) => {
          setDraftTitle(event.target.value)
          if (titleError) setTitleError(null)
        }}
        error={titleError ?? undefined}
        required
      />
      <div className={styles.deadlineRow}>
        <DatePicker
          label="Fecha límite"
          optional
          value={draftDeadline}
          onChange={setDraftDeadline}
          fieldClassName={styles.deadlineField}
          placeholder="Sin fecha"
        />
        {draftDeadline ? (
          <Button variant="ghost" size="sm" onClick={() => setDraftDeadline(null)}>
            Quitar fecha
          </Button>
        ) : null}
      </div>
      <div className={styles.editorActions}>
        <Button type="submit" variant="primary" size="sm">
          Guardar hito
        </Button>
        <Button variant="ghost" size="sm" onClick={cancelEditing}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
