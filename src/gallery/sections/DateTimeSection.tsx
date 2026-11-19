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
            {departure ? `Leaves ${formatDate(departure)}.` : 'No departure.'}
            {arrival ? ` Arrives ${formatDate(arrival)}.` : ''}
          </DemoNote>
        </DemoGroup>

        <DemoGroup label="Time">
          <TimePicker
            label="Departure bell"
            value={council}
            onChange={setCouncil}
            minuteStep={5}
            clearable
          />
          <TimePicker
            label="Council time"
            defaultValue="07:15"
            minuteStep={15}
            error="The council hour has already passed."
          />
          <DemoNote live>
            {council ? `Bell at ${council}.` : 'No bell set.'}
          </DemoNote>
        </DemoGroup>
      </DemoGrid>
    </Card>
  )
}
