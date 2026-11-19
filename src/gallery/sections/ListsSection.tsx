import { useState } from 'react'
import { Badge } from '../../components/Badge/Badge'
import { Card } from '../../components/Card/Card'
import { Combobox } from '../../components/Combobox/Combobox'
import { Icon } from '../../components/Icon/Icon'
import { Select } from '../../components/Select/Select'
import { DemoGrid, DemoGroup, DemoNote } from '../Demo'
import type { SectionProps } from '../SectionProps'
import styles from './sections.module.css'

const ROLES = [
  {
    value: 'wanderer',
    label: 'Wanderer',
    description: 'Reads the ice and walks light.',
    icon: <Icon name="compass" size="sm" />,
  },
  {
    value: 'ranger',
    label: 'Ranger',
    description: 'Knows every trail and every trap.',
    icon: <Icon name="leaf" size="sm" />,
  },
  {
    value: 'healer',
    label: 'Healer',
    description: 'Trades bandages for stories.',
    icon: <Icon name="heart" size="sm" />,
  },
  {
    value: 'smith',
    label: 'Smith',
    description: 'The anvil before the word.',
    icon: <Icon name="flame" size="sm" />,
  },
  {
    value: 'scribe',
    label: 'Scribe',
    description: 'Writes down what winter erases.',
    icon: <Icon name="feather" size="sm" />,
  },
]

const TASKS = [
  {
    value: 'waterskin',
    label: 'Fill the waterskin at the stream',
    description: 'Survival · at dawn',
    icon: <Icon name="bowl" size="sm" />,
  },
  {
    value: 'planks',
    label: 'Deliver three planks to Alderic',
    description: 'Offering · before nightfall',
    icon: <Icon name="axe" size="sm" />,
  },
  {
    value: 'lantern',
    label: 'Return the brass lantern',
    description: 'Debt · borrowed from the smith',
    icon: <Icon name="lantern" size="sm" />,
  },
  {
    value: 'watchtower',
    label: 'Visit the north watchtower',
    description: 'Exploration · burns every seventh night',
    icon: <Icon name="mountain" size="sm" />,
  },
]

export function ListsSection({ canvas }: SectionProps) {
  const [role, setRole] = useState('wanderer')
  const [task, setTask] = useState('')
  const roleLabel = ROLES.find((item) => item.value === role)?.label
  const taskLabel = TASKS.find((item) => item.value === task)?.label

  return (
    <Card
      size="lg"
      surface={canvas}
      kicker={
        <Badge variant="outline" size="sm" className={styles.componentBadge}>
          Select · Combobox
        </Badge>
      }
      title="Choosing among what is written"
      description="A dropdown of closed options and a list that filters as you type. Both anchor to the field, respect the keyboard, and return to their place if the screen changes."
      folio="04"
      tilt="left"
    >
      <DemoGrid>
        <DemoGroup label="Select">
          <Select
            label="Wanderer class"
            options={ROLES}
            value={role}
            onChange={setRole}
            hint="Determines your starting kit."
            leadingIcon={<Icon name="compass" size="sm" />}
          />
          <DemoNote live>
            {roleLabel ? `The journal files you as ${roleLabel}.` : 'No class assigned.'}
          </DemoNote>
          <Select
            label="Compact size"
            size="sm"
            options={ROLES}
            defaultValue="scribe"
            labelAside={<span>optional</span>}
          />
        </DemoGroup>

        <DemoGroup label="Combobox">
          <Combobox
            label="Task of the day"
            options={TASKS}
            value={task}
            onChange={setTask}
            leadingIcon={<Icon name="search" size="sm" />}
            placeholder="Search the tasks…"
            hint="Type to filter; use the arrow keys to walk the list."
          />
          <DemoNote live>
            {taskLabel
              ? `In the journal: “${taskLabel}”.`
              : 'You have not chosen a task yet.'}
          </DemoNote>
          <Combobox
            label="Disabled combobox"
            options={TASKS}
            defaultValue="watchtower"
            disabled
          />
        </DemoGroup>
      </DemoGrid>
    </Card>
  )
}
