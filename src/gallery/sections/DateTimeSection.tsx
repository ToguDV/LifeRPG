import { useState } from 'react'
import { Badge } from '../../components/Badge/Badge'
import { Card } from '../../components/Card/Card'
import { DatePicker } from '../../components/DatePicker/DatePicker'
import { TimePicker } from '../../components/TimePicker/TimePicker'
import { formatDate, startOfDay } from '../../lib/format'
import { DemoGrid, DemoGroup, DemoNote } from '../Demo'
import type { SectionProps } from '../SectionProps'
import styles from './sections.module.css'

function inDays(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return startOfDay(date)
}

export function DateTimeSection({ canvas }: SectionProps) {
  const today = startOfDay(new Date())
  const maxDate = inDays(60)
  const [departure, setDeparture] = useState<Date | null>(() => inDays(3))
  const [arrival, setArrival] = useState<Date | null>(null)
  const [council, setCouncil] = useState<string | null>('18:30')

  return (
    <Card
      size="lg"
      surface={canvas}
      kicker={
        <Badge variant="outline" size="sm" className={styles.componentBadge}>
          DatePicker · TimePicker
        </Badge>
      }
      title="Time, carved"
      description="A six-week calendar that starts on Monday and a bell wheel with five-minute steps. Both open in a floating dialog, can be walked with the keyboard, and close with Escape."
      folio="06"
      tilt="left"
    >
      <DemoGrid>
        <DemoGroup label="Date">
          <DatePicker
            label="Departure date"
            value={departure}
            onChange={setDeparture}
            min={today}
            max={maxDate}
            hint="The past is struck through; there is a two-month window."
          />
          <DatePicker
            label="Arrival date"
            value={arrival}
            onChange={setArrival}
            min={today}
            isDateDisabled={(date) => date.getDay() === 0}
            hint="No walking on Sundays."
          />
          <DemoNote live>
            {departure ? `You leave on ${formatDate(departure)}.` : 'No departure date yet.'}
            {arrival ? ` You arrive on ${formatDate(arrival)}.` : ''}
          </DemoNote>
        </DemoGroup>

        <DemoGroup label="Time">
          <TimePicker
            label="Departure bell"
            value={council}
            onChange={setCouncil}
            minuteStep={5}
            clearable
            hint="Twenty-four hours; five-minute steps."
          />
          <TimePicker
            label="Council time"
            defaultValue="07:15"
            minuteStep={15}
            error="The council hour has already passed."
          />
          <DemoNote live>
            {council ? `The bell rings at ${council}.` : 'No bell time set.'}
          </DemoNote>
        </DemoGroup>
      </DemoGrid>
    </Card>
  )
}
