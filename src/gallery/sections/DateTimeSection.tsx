import { useState } from 'react'
import { DatePicker } from '../../components/DatePicker/DatePicker'
import { TimePicker } from '../../components/TimePicker/TimePicker'
import { formatDate, startOfDay } from '../../lib/format'
import { DemoCard } from '../DemoCard'
import { DemoGrid, DemoGroup, DemoNote } from '../Demo'
import type { SectionProps } from '../SectionProps'

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
    <DemoCard
      canvas={canvas}
      component="DatePicker · TimePicker"
      title="El tiempo, tallado"
      description="Un calendario de seis semanas que empieza en lunes y una rueda de campanas con pasos de cinco minutos. Ambos se abren en un diálogo flotante, se recorren con el teclado y se cierran con Escape."
      folio="06"
      tilt="left"
    >
      <DemoGrid>
        <DemoGroup label="Fecha">
          <DatePicker
            label="Fecha de partida"
            value={departure}
            onChange={setDeparture}
            min={today}
            max={maxDate}
            hint="El pasado queda tachado; hay dos meses de margen."
          />
          <DatePicker
            label="Fecha de llegada"
            value={arrival}
            onChange={setArrival}
            min={today}
            isDateDisabled={(date) => date.getDay() === 0}
            hint="Los domingos no se camina."
          />
          <DemoNote live>
            {departure ? `Sales el ${formatDate(departure)}.` : 'Aún no hay fecha de salida.'}
            {arrival ? ` Llegas el ${formatDate(arrival)}.` : ''}
          </DemoNote>
        </DemoGroup>

        <DemoGroup label="Hora">
          <TimePicker
            label="Campanada de salida"
            value={council}
            onChange={setCouncil}
            minuteStep={5}
            clearable
            hint="Horas de veinticuatro; minutos de cinco en cinco."
          />
          <TimePicker
            label="Hora del consejo"
            defaultValue="07:15"
            minuteStep={15}
            error="La hora del consejo ya pasó."
          />
          <DemoNote live>
            {council ? `La campana suena a las ${council}.` : 'No hay campanada fijada.'}
          </DemoNote>
        </DemoGroup>
      </DemoGrid>
    </DemoCard>
  )
}
