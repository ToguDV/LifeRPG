import { useState } from 'react'
import { Icon } from '../../components/Icon/Icon'
import { Textarea } from '../../components/Textarea/Textarea'
import { TextInput } from '../../components/TextInput/TextInput'
import { DemoCard } from '../DemoCard'
import { DemoGrid, DemoGroup, DemoNote } from '../Demo'
import type { SectionProps } from '../SectionProps'
import styles from './sections.module.css'

const INITIAL_NOTES =
  'La atalaya del norte arde cada séptima noche. Llevar yesca, una segunda capa de lana y el farol de latón antes de que cierre la puerta.'

export function FieldsSection({ canvas }: SectionProps) {
  const [search, setSearch] = useState('')
  const [notes, setNotes] = useState(INITIAL_NOTES)

  return (
    <DemoCard
      canvas={canvas}
      component="TextInput · Textarea"
      title="Tinta sobre la línea"
      description="Etiquetas talladas, pistas escritas a mano y errores que no gritan. Los campos comparten la misma geometría de control en papel y en panel."
      folio="03"
      tilt="right"
    >
      <DemoGrid>
        <DemoGroup label="Entradas de una línea">
          <TextInput
            label="Nombre del caminante"
            defaultValue="Maho de la Marca Hueca"
            hint="Como aparecerá en el registro del gremio."
          />
          <TextInput
            label="Buscar en el diario"
            leadingIcon={<Icon name="search" size="sm" />}
            placeholder="Tareas, lugares, personas…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch('')}
            clearable
            hint="La búsqueda no distingue mayúsculas."
          />
          <DemoNote live>
            {search ? `Buscando «${search}» por los márgenes.` : 'El campo está en silencio.'}
          </DemoNote>
          <TextInput
            label="Recompensa"
            defaultValue="40"
            inputMode="numeric"
            prefix={<Icon name="spark" size="xs" />}
            suffix="monedas"
            hint="El gremio paga en monedas viejas."
          />
        </DemoGroup>

        <DemoGroup label="Estados y escala">
          <TextInput
            label="Correo del gremio"
            defaultValue="maho@"
            error="Ese sello no parece válido."
            hint="Usa una dirección completa."
          />
          <TextInput
            label="Sello del gremio"
            defaultValue="MC-812"
            disabled
            hint="Emitido en la tercera campanada."
          />
          <div className={styles.sizeFields}>
            <TextInput size="sm" label="Pequeño" placeholder="Corto" />
            <TextInput size="md" label="Mediano" placeholder="Medio" />
            <TextInput size="lg" label="Grande" placeholder="Largo" />
          </div>
          <DemoNote muted>El alto y el cuerpo cambian; los tokens no.</DemoNote>
        </DemoGroup>

        <DemoGroup label="Entradas de varias líneas" span>
          <Textarea
            label="Notas de la expedición"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={220}
            showCount
            hint="Se guarda al cerrar el diario."
          />
          <Textarea
            label="Autoajustable"
            placeholder="Escribe y el campo crecerá contigo…"
            autoGrow
            maxLength={140}
            showCount
            hint="Sin barra de desplazamiento hasta que el texto pida más."
          />
          <Textarea
            label="Última voluntad"
            defaultValue="Que el farol vuelva a la viuda."
            error="Falta la firma del testigo."
            resize="none"
          />
        </DemoGroup>
      </DemoGrid>
    </DemoCard>
  )
}
