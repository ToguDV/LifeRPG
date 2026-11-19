import type { BadgeVariant } from '../Badge/Badge'
import type { IconName } from '../Icon/Icon'
import type { QuestNodeState } from './questline-model'

export interface QuestStateMeta {
  /** Marker icon on the rail; the current milestone carries none. */
  icon: IconName | null
  /** Spoken after the milestone number: «Bloqueado.». */
  word: string
  /** Visible badge in the panel. */
  label: string
  badgeVariant: BadgeVariant
}

/*
   One table for the four derived states. The rail and the panel used to keep
   separate maps, so a state could read one way in the rail and another in the
   drawer — that is how the active milestone ended up without a spoken word.
*/
export const STATE_META: Record<QuestNodeState, QuestStateMeta> = {
  locked: {
    icon: 'lock',
    word: 'Bloqueado.',
    label: 'Bloqueado',
    badgeVariant: 'outline',
  },
  active: {
    icon: null,
    word: 'En curso.',
    label: 'En curso',
    badgeVariant: 'accent',
  },
  complete: {
    icon: 'check',
    word: 'Cumplido.',
    label: 'Cumplido',
    badgeVariant: 'success',
  },
  overdue: {
    icon: 'alert',
    word: 'Vencido.',
    label: 'Vencido',
    badgeVariant: 'danger',
  },
}
