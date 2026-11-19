import { useState } from 'react'
import { Badge } from '../../components/Badge/Badge'
import { Card } from '../../components/Card/Card'
import { RangeSlider, Slider } from '../../components/Slider/Slider'
import { Stepper } from '../../components/Stepper/Stepper'
import { DemoGrid, DemoGroup, DemoNote } from '../Demo'
import type { SectionProps } from '../SectionProps'
import styles from './sections.module.css'

const RESISTANCE_MARKS = [
  { value: 0, label: 'Spent' },
  { value: 50, label: 'Steady' },
  { value: 100, label: 'Full' },
]

const VIGIL_MARKS = [
  { value: 0, label: '0 h' },
  { value: 6, label: '6 h' },
  { value: 12, label: '12 h' },
  { value: 18, label: '18 h' },
  { value: 24, label: '24 h' },
]

export function NumbersSection({ canvas }: SectionProps) {
  const [resistance, setResistance] = useState(68)
  const [vigil, setVigil] = useState<[number, number]>([7, 18])
  const [rations, setRations] = useState(4)
  const [torches, setTorches] = useState(2)

  return (
    <Card
      size="lg"
      surface={canvas}
      kicker={
        <Badge variant="outline" size="sm" className={styles.componentBadge}>
          Slider · RangeSlider · Stepper
        </Badge>
      }
      title="Taking the pulse"
      description="Sliders with marks and value bubbles, a two-thumb range, and counters with limits. All of them answer to the keyboard and respect the bounds."
      folio="05"
      tilt="right"
    >
      <DemoGrid columns={3}>
        <DemoGroup label="Slider">
          <Slider
            label="Resistance"
            min={0}
            max={100}
            step={5}
            value={resistance}
            onChange={setResistance}
            showValue
            formatValue={(value) => `${value}%`}
            marks={RESISTANCE_MARKS}
            hint="It drops when you cross the ford or sleep in the open."
          />
          <DemoNote live>
            {resistance >= 80
              ? 'You can still handle the winter.'
              : resistance >= 40
                ? 'The pace is steady, but you should eat.'
                : 'Every league weighs. Find shelter.'}
          </DemoNote>
        </DemoGroup>

        <DemoGroup label="Two-thumb range">
          <RangeSlider
            label="Night watches"
            min={0}
            max={24}
            step={1}
            value={vigil}
            onChange={setVigil}
            formatValue={(value) => `${value} h`}
            marks={VIGIL_MARKS}
            hint="From dusk until dawn."
          />
          <DemoNote live>
            {vigil[1] - vigil[0]} hours awake; {24 - (vigil[1] - vigil[0])} for
            sleep.
          </DemoNote>
        </DemoGroup>

        <DemoGroup label="Counters">
          <Stepper
            label="Travel rations"
            min={0}
            max={20}
            step={1}
            value={rations}
            onChange={setRations}
            suffix="days"
            hint="Each ration lasts one day on the road."
          />
          <Stepper
            label="Torches"
            min={0}
            max={12}
            step={1}
            size="sm"
            value={torches}
            onChange={setTorches}
            suffix="units"
          />
          <Stepper
            label="Locked seal"
            min={0}
            max={9}
            defaultValue={3}
            suffix="units"
            disabled
            hint="Issued by the guild; it cannot be changed."
          />
          <DemoNote>
            {rations} rations and {torches} torches in the satchel.
          </DemoNote>
        </DemoGroup>
      </DemoGrid>
    </Card>
  )
}
