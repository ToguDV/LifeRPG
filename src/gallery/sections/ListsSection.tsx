import { useState } from 'react'
import { Combobox } from '../../components/Combobox/Combobox'
import { Icon } from '../../components/Icon/Icon'
import { Select } from '../../components/Select/Select'
import { DemoCard } from '../DemoCard'
import { DemoGrid, DemoGroup, DemoNote } from '../Demo'
import type { SectionProps } from '../SectionProps'

const ROLES = [
  {
    value: 'viajera',
    label: 'Viajera',
    description: 'Lee el hielo y camina ligera.',
    icon: <Icon name="compass" size="sm" />,
  },
  {
    value: 'guardabosques',
    label: 'Guardabosques',
    description: 'Conoce cada senda y cada trampa.',
    icon: <Icon name="leaf" size="sm" />,
  },
  {
    value: 'sanadora',
    label: 'Sanadora',
    description: 'Cambia vendas por historias.',
    icon: <Icon name="heart" size="sm" />,
  },
  {
    value: 'herrera',
    label: 'Herrera',
    description: 'El yunque antes que la palabra.',
    icon: <Icon name="flame" size="sm" />,
  },
  {
    value: 'escriba',
    label: 'Escriba',
    description: 'Anota lo que el invierno borra.',
    icon: <Icon name="feather" size="sm" />,
  },
]

const TASKS = [
  {
    value: 'odre',
    label: 'Llenar el odre en el arroyo',
    description: 'Supervivencia · al alba',
    icon: <Icon name="bowl" size="sm" />,
  },
  {
    value: 'tablones',
    label: 'Entregar tres tablones a Alderic',
    description: 'Ofrenda · antes del anochecer',
    icon: <Icon name="axe" size="sm" />,
  },
  {
    value: 'farol',
    label: 'Devolver el farol de latón',
    description: 'Deuda · prestado al herrero',
    icon: <Icon name="lantern" size="sm" />,
  },
  {
    value: 'atalaya',
    label: 'Visitar la atalaya del norte',
    description: 'Exploración · arde cada séptima noche',
    icon: <Icon name="mountain" size="sm" />,
  },
]

export function ListsSection({ canvas }: SectionProps) {
  const [role, setRole] = useState('viajera')
  const [task, setTask] = useState('')
  const roleLabel = ROLES.find((item) => item.value === role)?.label
  const taskLabel = TASKS.find((item) => item.value === task)?.label

  return (
    <DemoCard
      canvas={canvas}
      component="Select · Combobox"
      title="Escoger entre lo escrito"
      description="Un desplegable de opciones cerradas y una lista que se filtra mientras escribes. Ambos se anclan al campo, respetan el teclado y vuelven a su sitio si la pantalla cambia."
      folio="04"
      tilt="left"
    >
      <DemoGrid>
        <DemoGroup label="Select">
          <Select
            label="Clase del caminante"
            options={ROLES}
            value={role}
            onChange={setRole}
            hint="Determina tus pertrechos iniciales."
            leadingIcon={<Icon name="compass" size="sm" />}
          />
          <DemoNote live>
            {roleLabel ? `El diario te registra como ${roleLabel}.` : 'Sin clase asignada.'}
          </DemoNote>
          <Select
            label="Tamaño compacto"
            size="sm"
            options={ROLES}
            defaultValue="escriba"
            labelAside={<span>opcional</span>}
          />
        </DemoGroup>

        <DemoGroup label="Combobox">
          <Combobox
            label="Tarea del día"
            options={TASKS}
            value={task}
            onChange={setTask}
            leadingIcon={<Icon name="search" size="sm" />}
            placeholder="Busca entre las tareas…"
            hint="Escribe para filtrar; usa las flechas para recorrer."
          />
          <DemoNote live>
            {taskLabel
              ? `En el diario: «${taskLabel}».`
              : 'Aún no has elegido una tarea.'}
          </DemoNote>
          <Combobox
            label="Combobox deshabilitado"
            options={TASKS}
            defaultValue="atalaya"
            disabled
          />
        </DemoGroup>
      </DemoGrid>
    </DemoCard>
  )
}
