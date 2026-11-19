import { useState } from 'react'
import { Badge } from '../../components/Badge/Badge'
import { Card } from '../../components/Card/Card'
import { Checkbox, CheckboxGroup } from '../../components/Checkbox/Checkbox'
import { Radio, RadioGroup } from '../../components/Radio/Radio'
import { Switch } from '../../components/Switch/Switch'
import { DemoGrid, DemoGroup, DemoNote } from '../Demo'
import type { SectionProps } from '../SectionProps'
import styles from './sections.module.css'

const PROVISIONS = [
  {
    id: 'bread',
    label: 'Rye bread',
    description: 'It lasts longer than it looks.',
  },
  {
    id: 'rope',
    label: 'Hemp rope',
    description: 'Twelve fathoms, a little worn.',
  },
  {
    id: 'lantern',
    label: 'Brass lantern',
    description: 'Borrowed; best returned.',
  },
]

const PACES = [
  {
    value: 'steady',
    label: 'Steady pace',
    description: 'You arrive dry and early.',
  },
  {
    value: 'fox',
    label: 'Fox step',
    description: 'Slower, quieter.',
  },
  {
    value: 'run',
    label: 'At a run',
    description: 'Your breath decides for you.',
  },
]

export function SelectionSection({ canvas }: SectionProps) {
  const [provisions, setProvisions] = useState<Record<string, boolean>>({
    bread: true,
    rope: false,
    lantern: true,
  })
  const [pace, setPace] = useState('steady')
  const [notices, setNotices] = useState(true)
  const [silent, setSilent] = useState(false)

  const selectedCount = PROVISIONS.filter((item) => provisions[item.id]).length
  const allSelected = selectedCount === PROVISIONS.length
  const someSelected = selectedCount > 0 && !allSelected
  const paceLabel = PACES.find((item) => item.value === pace)?.label ?? '—'

  return (
    <Card
      size="lg"
      surface={canvas}
      kicker={
        <Badge variant="outline" size="sm" className={styles.componentBadge}>
          Checkbox · Radio · Switch
        </Badge>
      }
      title="Small decisions"
      description="Three ways to choose: several, just one, or none. The wax of the control adapts to paper and panel without changing shape."
      folio="02"
      tilt="left"
    >
      <DemoGrid columns={3}>
        <DemoGroup label="Checkboxes">
          <CheckboxGroup
            label="Provisions for the journey"
            hint="Tick what the satchel will carry."
          >
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={(event) => {
                const next = event.target.checked
                setProvisions(
                  Object.fromEntries(PROVISIONS.map((item) => [item.id, next])),
                )
              }}
              label="The whole kit"
              description="One decision for all three provisions."
            />
            <span className={styles.groupBreak} aria-hidden="true" />
            {PROVISIONS.map((item) => (
              <Checkbox
                key={item.id}
                checked={provisions[item.id]}
                onChange={(event) =>
                  setProvisions((previous) => ({
                    ...previous,
                    [item.id]: event.target.checked,
                  }))
                }
                label={item.label}
                description={item.description}
              />
            ))}
            <Checkbox
              disabled
              label="Forgotten relic"
              description="It cannot be touched."
            />
          </CheckboxGroup>
          <DemoNote live>
            {selectedCount} of {PROVISIONS.length} provisions in the satchel.
          </DemoNote>
        </DemoGroup>

        <DemoGroup label="Radio buttons">
          <RadioGroup
            label="Marching pace"
            value={pace}
            onChange={setPace}
            hint="Only one trail at a time."
          >
            {PACES.map((item) => (
              <Radio
                key={item.value}
                value={item.value}
                label={item.label}
                description={item.description}
              />
            ))}
          </RadioGroup>
          <DemoNote live>Chosen: {paceLabel}.</DemoNote>
        </DemoGroup>

        <DemoGroup label="Switches">
          <div className={styles.controlStack}>
            <Switch
              checked={notices}
              onChange={(event) => setNotices(event.target.checked)}
              label="Journal notices"
              description="A whisper when a task falls due."
            />
            <Switch
              checked={silent}
              onChange={(event) => setSilent(event.target.checked)}
              label="Silent mode"
              description="Not a feather stirs."
              size="sm"
            />
            <Switch
              checked
              disabled
              label="Guild seal"
              description="Always on, by oath."
              size="sm"
            />
          </div>
          <DemoNote live>
            {notices ? 'Notices are awake' : 'Notices are asleep'} ·{' '}
            {silent ? 'silence' : 'voice'}.
          </DemoNote>
        </DemoGroup>
      </DemoGrid>
    </Card>
  )
}
