import { useState } from 'react'
import { Badge } from '../../components/Badge/Badge'
import { Card } from '../../components/Card/Card'
import { Icon } from '../../components/Icon/Icon'
import { TextInput } from '../../components/TextInput/TextInput'
import { Textarea } from '../../components/Textarea/Textarea'
import { DemoGrid, DemoGroup, DemoNote } from '../Demo'
import type { SectionProps } from '../SectionProps'
import styles from './sections.module.css'

const INITIAL_NOTES =
  'The north watchtower burns every seventh night. Bring tinder, a second layer of wool, and the brass lantern before the door closes.'

export function FieldsSection({ canvas }: SectionProps) {
  const [search, setSearch] = useState('')
  const [notes, setNotes] = useState(INITIAL_NOTES)

  return (
    <Card
      size="lg"
      surface={canvas}
      kicker={
        <Badge variant="outline" size="sm" className={styles.componentBadge}>
          TextInput · Textarea
        </Badge>
      }
      title="Ink on the line"
      folio="03"
      tilt="right"
    >
      <DemoGrid>
        <DemoGroup label="Single-line inputs">
          <TextInput
            label="Wanderer’s name"
            defaultValue="Maho of the Hollow Mark"
          />
          <TextInput
            label="Search the journal"
            leadingIcon={<Icon name="search" size="sm" />}
            placeholder="Tasks, places, people…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch('')}
            clearable
          />
          <DemoNote live>
            {search ? `Searching “${search}”.` : 'No search.'}
          </DemoNote>
          <TextInput
            label="Reward"
            defaultValue="40"
            inputMode="numeric"
            prefix={<Icon name="spark" size="xs" />}
            suffix="coins"
          />
        </DemoGroup>

        <DemoGroup label="States and scale">
          <TextInput
            label="Guild mail"
            defaultValue="maho@"
            error="That seal does not look valid."
            hint="Use a full address."
          />
          <TextInput label="Guild seal" defaultValue="MC-812" disabled />
          <div className={styles.sizeFields}>
            <TextInput size="sm" label="Small" placeholder="Short" />
            <TextInput size="md" label="Medium" placeholder="Medium" />
            <TextInput size="lg" label="Large" placeholder="Long" />
          </div>
        </DemoGroup>

        <DemoGroup label="Multi-line inputs" span>
          <Textarea
            label="Expedition notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={220}
            showCount
          />
          <Textarea
            label="Auto-growing"
            placeholder="Type, and the field grows with you…"
            autoGrow
            maxLength={140}
            showCount
          />
          <Textarea
            label="Last will"
            defaultValue="Let the lantern go back to the widow."
            error="The witness signature is missing."
            resize="none"
          />
        </DemoGroup>
      </DemoGrid>
    </Card>
  )
}
