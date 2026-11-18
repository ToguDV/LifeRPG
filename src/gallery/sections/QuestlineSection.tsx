import { useState } from 'react'
import { Badge } from '../../components/Badge/Badge'
import { Button } from '../../components/Button/Button'
import { Card } from '../../components/Card/Card'
import { Icon } from '../../components/Icon/Icon'
import { Questline, type QuestNode } from '../../components/Questline/Questline'
import { isQuestNodeComplete } from '../../components/Questline/questline-model'
import { addDays, dateKey } from '../../lib/date'
import { DemoNote } from '../Demo'
import type { SectionProps } from '../SectionProps'
import styles from './sections.module.css'

/**
 * Deadlines are relative to today so the demo keeps showing all three
 * states — closed, overdue and still ahead — whenever the gallery is opened.
 */
function makeSeed(): QuestNode[] {
  const today = new Date()
  const deadline = (days: number) => dateKey(addDays(today, days))

  return [
    {
      id: 'provisiones',
      title: 'Las provisiones',
      note: 'El odre, la sal y la yesca.',
      deadline: deadline(-4),
      tasks: [
        { id: 'odre', title: 'Llenar el odre en el arroyo', done: true },
        { id: 'sal', title: 'Sellar la sal en el paño encerado', done: true },
        { id: 'yesca', title: 'Cambiar la yesca del yesquero', done: true },
      ],
    },
    {
      id: 'pozo',
      title: 'El pozo ciego',
      note: 'Nadie baja dos veces con el mismo cubo.',
      deadline: deadline(-1),
      tasks: [
        { id: 'cuerda', title: 'Atar la cuerda al cabrestante', done: true },
        { id: 'farol', title: 'Bajar el farol de latón', done: false },
        { id: 'agua', title: 'Subir el cubo sin tocar el fondo', done: false },
      ],
    },
    {
      id: 'atalaya',
      title: 'La atalaya del norte',
      note: 'Arde cada séptima noche.',
      deadline: deadline(5),
      tasks: [
        { id: 'lena', title: 'Subir la leña seca', done: false },
        { id: 'senal', title: 'Encender la señal al anochecer', done: false },
      ],
    },
    {
      id: 'tablones',
      title: 'Los tablones de Alderic',
      deadline: deadline(11),
      tasks: [
        { id: 'cortar', title: 'Cortar tres tablones de pino', done: false },
        { id: 'secar', title: 'Dejarlos secar bajo la nieve', done: false },
        { id: 'entregar', title: 'Entregarlos antes del deshielo', done: false },
      ],
    },
    {
      id: 'paso',
      title: 'El paso de la Marca',
      note: 'La nieve borra el camino cada mañana.',
      deadline: deadline(17),
      tasks: [
        { id: 'guia', title: 'Tender la cuerda guía', done: false },
        { id: 'marcas', title: 'Clavar las marcas de la ruta', done: false },
      ],
    },
    {
      id: 'puerta',
      title: 'La puerta hueca',
      note: 'Al otro lado, el invierno termina.',
      deadline: deadline(24),
      tasks: [
        { id: 'llave', title: 'Encontrar la llave de hueso', done: false },
        { id: 'umbral', title: 'Cruzar el umbral antes del deshielo', done: false },
      ],
    },
  ]
}

export function QuestlineSection({ canvas }: SectionProps) {
  const [nodes, setNodes] = useState<QuestNode[]>(makeSeed)

  const closed = nodes.filter(isQuestNodeComplete).length
  const done = nodes.reduce(
    (sum, node) => sum + node.tasks.filter((task) => task.done).length,
    0,
  )
  const total = nodes.reduce((sum, node) => sum + node.tasks.length, 0)

  return (
    <Card
      size="lg"
      surface={canvas}
      kicker={
        <Badge variant="outline" size="sm" className={styles.componentBadge}>
          Questline · QuestNode · QuestTask
        </Badge>
      }
      title="La ruta del invierno"
      description="Una línea de hitos; cada uno con su lista de tareas y su fecha. Al cerrar todas sus tareas, el siguiente hito abre la puerta y el sendero se entinta. Tareas, plazos y nombres se editan aquí mismo."
      folio="10"
      tilt="right"
    >
      <div className={styles.questDemo}>
        <Questline
          nodes={nodes}
          onChange={setNodes}
          label="Travesía de la Marca Hueca"
          addNodeLabel="Añadir hito"
        />

        <div className={styles.questFoot}>
          <DemoNote muted>
            {closed} de {nodes.length} hitos cerrados · {done} de {total} tareas
            cumplidas. Un hito sin tareas no se considera cerrado.
          </DemoNote>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Icon name="scroll" size="sm" />}
            onClick={() => setNodes(makeSeed())}
          >
            Volver al parte inicial
          </Button>
        </div>
      </div>
    </Card>
  )
}
