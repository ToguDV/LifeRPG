import { cx } from '../../lib/cx'
import { Button } from '../Button/Button'
import { Checkbox } from '../Checkbox/Checkbox'
import { Icon } from '../Icon/Icon'
import { TextInput } from '../TextInput/TextInput'
import type { QuestTask } from './questline-model'
import styles from './QuestNodePanel.module.css'

export interface QuestTaskRowProps {
  task: QuestTask
  /** A locked milestone can prepare tasks but cannot tick them. */
  locked: boolean
  editing: boolean
  draft: string
  error: string | null
  rowRef: (element: HTMLLIElement | null) => void
  onStartEdit: () => void
  onDraftChange: (value: string) => void
  onSubmit: () => void
  onCancelEdit: () => void
  onToggle: (done: boolean) => void
  onDelete: () => void
}

/** One quest inside the drawer: checkbox, idle tools or inline rename form. */
export function QuestTaskRow({
  task,
  locked,
  editing,
  draft,
  error,
  rowRef,
  onStartEdit,
  onDraftChange,
  onSubmit,
  onCancelEdit,
  onToggle,
  onDelete,
}: QuestTaskRowProps) {
  return (
    <li ref={rowRef} className={styles.task}>
      {editing ? (
        <form
          className={styles.taskEdit}
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
        >
          <TextInput
            aria-label={`Title of “${task.title}”`}
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            error={error ?? undefined}
            size="sm"
            autoFocus
            fieldClassName={styles.taskEditField}
            onKeyDown={(event) => {
              /*
                The first Escape of an IME composition cancels the candidate
                list, not the rename: closing here would drop the draft.
                React's synthetic event does not carry `isComposing`, so read
                the native one.
              */
              const { isComposing, keyCode } = event.nativeEvent
              if (isComposing || keyCode === 229) return
              if (event.key === 'Escape') {
                event.preventDefault()
                onCancelEdit()
              }
            }}
          />
          <div className={styles.taskTools}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              iconOnly
              aria-label="Save changes"
              iconLeft={<Icon name="check" size="sm" />}
            />
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label="Cancel edit"
              iconLeft={<Icon name="close" size="sm" />}
              onClick={onCancelEdit}
            />
          </div>
        </form>
      ) : (
        <>
          <Checkbox
            label={task.title}
            checked={task.done}
            disabled={locked}
            strikeWhenChecked
            onChange={(event) => onToggle(event.target.checked)}
          />
          <div className={cx(styles.taskTools, styles.taskToolsIdle)}>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={`Edit “${task.title}”`}
              iconLeft={<Icon name="edit" size="sm" />}
              onClick={onStartEdit}
            />
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={`Delete “${task.title}”`}
              iconLeft={<Icon name="trash" size="sm" />}
              onClick={onDelete}
            />
          </div>
        </>
      )}
    </li>
  )
}
