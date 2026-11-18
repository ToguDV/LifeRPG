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
    id: 'pan',
    label: 'Pan de centeno',
    description: 'Dura más de lo que parece.',
  },
  {
    id: 'cuerda',
    label: 'Cuerda de cáñamo',
    description: 'Doce brazas, algo gastada.',
  },
  {
    id: 'farol',
    label: 'Farol de latón',
    description: 'Prestado; conviene devolverlo.',
  },
]

const PACES = [
  {
    value: 'paso',
    label: 'Paso firme',
    description: 'Llegas seco y temprano.',
  },
  {
    value: 'sigilo',
    label: 'Paso de zorro',
    description: 'Más lento, menos ruido.',
  },
  {
    value: 'carrera',
    label: 'A la carrera',
    description: 'El aliento decide por ti.',
  },
]

export function SelectionSection({ canvas }: SectionProps) {
  const [provisions, setProvisions] = useState<Record<string, boolean>>({
    pan: true,
    cuerda: false,
    farol: true,
  })
  const [pace, setPace] = useState('paso')
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
      title="Decisiones pequeñas"
      description="Tres formas de elegir: varias, una sola, o ninguna. La cera del control se adapta al papel y al panel sin cambiar de forma."
      folio="02"
      tilt="left"
    >
      <DemoGrid columns={3}>
        <DemoGroup label="Casillas">
          <CheckboxGroup
            label="Provisiones para el viaje"
            hint="Marca lo que cargará el zurrón."
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
              label="Todo el equipo"
              description="Una sola decisión para las tres provisiones."
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
              label="Reliquia olvidada"
              description="No se puede tocar."
            />
          </CheckboxGroup>
          <DemoNote live>
            {selectedCount} de {PROVISIONS.length} provisiones en el zurrón.
          </DemoNote>
        </DemoGroup>

        <DemoGroup label="Radios">
          <RadioGroup
            label="Ritmo de la marcha"
            value={pace}
            onChange={setPace}
            hint="Solo una senda a la vez."
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
          <DemoNote live>Elegido: {paceLabel}.</DemoNote>
        </DemoGroup>

        <DemoGroup label="Conmutadores">
          <div className={styles.controlStack}>
            <Switch
              checked={notices}
              onChange={(event) => setNotices(event.target.checked)}
              label="Avisos del diario"
              description="Un susurro cuando una tarea vence."
            />
            <Switch
              checked={silent}
              onChange={(event) => setSilent(event.target.checked)}
              label="Modo silencioso"
              description="Ni una pluma se mueve."
              size="sm"
            />
            <Switch
              checked
              disabled
              label="Sello del gremio"
              description="Siempre encendido, por juramento."
              size="sm"
            />
          </div>
          <DemoNote live>
            {notices ? 'Los avisos están despiertos' : 'Los avisos duermen'} ·{' '}
            {silent ? 'silencio' : 'voz'}.
          </DemoNote>
        </DemoGroup>
      </DemoGrid>
    </Card>
  )
}
