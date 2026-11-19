import type { RefObject } from 'react'
import { Button } from '../Button/Button'
import styles from './QuestNodePanel.module.css'

export interface QuestDeleteConfirmProps {
  title: string
  taskCount: number
  /** Focus lands on Cancel while the confirmation is open. */
  cancelRef: RefObject<HTMLSpanElement | null>
  onConfirm: () => void
  onCancel: () => void
}

/** Two-step deletion: the irreversible action never sits under the pointer. */
export function QuestDeleteConfirm({
  title,
  taskCount,
  cancelRef,
  onConfirm,
  onCancel,
}: QuestDeleteConfirmProps) {
  return (
    <div
      className={styles.confirm}
      role="group"
      aria-label="Confirmar la eliminación del hito"
    >
      <p className={styles.confirmText} role="alert">
        ¿Eliminar «{title}»
        {taskCount
          ? ` y sus ${taskCount} ${taskCount === 1 ? 'tarea' : 'tareas'}`
          : ''}
        ? No se puede deshacer.
      </p>
      <Button variant="danger" size="sm" onClick={onConfirm}>
        Sí, eliminar el hito
      </Button>
      <span ref={cancelRef}>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
      </span>
    </div>
  )
}
