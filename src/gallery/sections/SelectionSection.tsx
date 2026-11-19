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
  { id: 'bread', label: 'Rye bread' },
  { id: 'rope', label: 'Hemp rope' },
  { id: 'lantern', label: 'Brass lantern' },
]

const PACES = [
  { value: 'steady', label: 'Steady pace' },
  { value: 'fox', label: 'Fox step' },
  { value: 'run', label: 'At a run' },
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
      folio="02"
      tilt="left"
    >
      <DemoGrid columns={3}>
        <DemoGroup label="Checkboxes">
          <CheckboxGroup label="Provisions for the journey">
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
              description="Selects all three."
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
              />
            ))}
            <Checkbox disabled label="Forgotten relic" />
          </CheckboxGroup>
          <DemoNote live>
            {selectedCount} of {PROVISIONS.length} selected.
          </DemoNote>
        </DemoGroup>

        <DemoGroup label="Radio buttons">
          <RadioGroup label="Marching pace" value={pace} onChange={setPace}>
            {PACES.map((item) => (
              <Radio key={item.value} value={item.value} label={item.label} />
            ))}
          </RadioGroup>
          <DemoNote live>Pace: {paceLabel}.</DemoNote>
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
              size="sm"
            />
            <Switch checked disabled label="Guild seal" size="sm" />
          </div>
          <DemoNote live>
            {notices ? 'Notices on' : 'Notices off'} · {silent ? 'silent' : 'sound'}.
          </DemoNote>
        </DemoGroup>
      </DemoGrid>
    </Card>
  )
}
