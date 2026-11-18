import { useState } from 'react'
import { RangeSlider, Slider } from '../../components/Slider/Slider'
import { Stepper } from '../../components/Stepper/Stepper'
import { DemoCard } from '../DemoCard'
import { DemoGrid, DemoGroup, DemoNote } from '../Demo'
import type { SectionProps } from '../SectionProps'

const RESISTANCE_MARKS = [
  { value: 0, label: 'Agotada' },
  { value: 50, label: 'Firme' },
  { value: 100, label: 'Plena' },
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
    <DemoCard
      canvas={canvas}
      component="Slider · RangeSlider · Stepper"
      title="Medir el pulso"
      description="Deslizadores con marcas y burbujas de valor, un rango de dos pulgares y contadores con límites. Todos responden al teclado y respetan los topes."
      folio="05"
      tilt="right"
    >
      <DemoGrid columns={3}>
        <DemoGroup label="Deslizador">
          <Slider
            label="Resistencia"
            min={0}
            max={100}
            step={5}
            value={resistance}
            onChange={setResistance}
            showValue
            formatValue={(value) => `${value}%`}
            marks={RESISTANCE_MARKS}
            hint="Baja al cruzar el vado o pasar la noche al raso."
          />
          <DemoNote live>
            {resistance >= 80
              ? 'Aún puedes con el invierno.'
              : resistance >= 40
                ? 'El paso es firme, pero conviene comer.'
                : 'Cada legua pesa. Busca refugio.'}
          </DemoNote>
        </DemoGroup>

        <DemoGroup label="Rango de dos pulgares">
          <RangeSlider
            label="Guardias de la noche"
            min={0}
            max={24}
            step={1}
            value={vigil}
            onChange={setVigil}
            formatValue={(value) => `${value} h`}
            marks={VIGIL_MARKS}
            hint="Desde el ocaso hasta el alba."
          />
          <DemoNote live>
            {vigil[1] - vigil[0]} horas de vigilia; {24 - (vigil[1] - vigil[0])} para
            dormir.
          </DemoNote>
        </DemoGroup>

        <DemoGroup label="Contadores">
          <Stepper
            label="Raciones de viaje"
            min={0}
            max={20}
            step={1}
            value={rations}
            onChange={setRations}
            suffix="días"
            hint="Cada ración aguanta una jornada."
          />
          <Stepper
            label="Antorchas"
            min={0}
            max={12}
            step={1}
            size="sm"
            value={torches}
            onChange={setTorches}
            suffix="uds."
          />
          <Stepper
            label="Sello bloqueado"
            min={0}
            max={9}
            defaultValue={3}
            suffix="uds."
            disabled
            hint="Emitido por el gremio; no se puede cambiar."
          />
          <DemoNote>
            {rations} raciones y {torches} antorchas en el zurrón.
          </DemoNote>
        </DemoGroup>
      </DemoGrid>
    </DemoCard>
  )
}
