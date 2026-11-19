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
 * states — completed, overdue and still ahead — whenever the gallery is opened.
 */
function makeSeed(): QuestNode[] {
  const today = new Date()
  const deadline = (days: number) => dateKey(addDays(today, days))

  return [
    {
      id: 'provisions',
      title: 'The provisions',
      note: 'The waterskin, the salt, and the tinder.',
      deadline: deadline(-4),
      tasks: [
        { id: 'waterskin', title: 'Fill the waterskin at the stream', done: true },
        { id: 'salt', title: 'Seal the salt in the waxed cloth', done: true },
        { id: 'tinder', title: 'Change the tinder in the firebox', done: true },
      ],
    },
    {
      id: 'well',
      title: 'The blind well',
      note: 'Nobody goes down twice with the same bucket.',
      deadline: deadline(-1),
      tasks: [
        { id: 'rope', title: 'Tie the rope to the winch', done: true },
        { id: 'lantern', title: 'Lower the brass lantern', done: false },
        { id: 'water', title: 'Raise the bucket without touching the bottom', done: false },
      ],
    },
    {
      id: 'watchtower',
      title: 'The north watchtower',
      note: 'It burns every seventh night.',
      deadline: deadline(5),
      tasks: [
        { id: 'firewood', title: 'Carry the dry firewood up', done: false },
        { id: 'signal', title: 'Light the signal at dusk', done: false },
      ],
    },
    {
      id: 'planks',
      title: 'Alderic’s planks',
      deadline: deadline(11),
      tasks: [
        { id: 'cut', title: 'Cut three pine planks', done: false },
        { id: 'dry', title: 'Leave them to dry under the snow', done: false },
        { id: 'deliver', title: 'Deliver them before the thaw', done: false },
      ],
    },
    {
      id: 'pass',
      title: 'The Hollow Mark pass',
      note: 'The snow erases the path every morning.',
      deadline: deadline(17),
      tasks: [
        { id: 'guide', title: 'Run the guide rope', done: false },
        { id: 'markers', title: 'Drive the route markers', done: false },
      ],
    },
    {
      id: 'door',
      title: 'The hollow door',
      note: 'On the other side, winter ends.',
      deadline: deadline(24),
      tasks: [
        { id: 'key', title: 'Find the bone key', done: false },
        { id: 'threshold', title: 'Cross the threshold before the thaw', done: false },
      ],
    },
  ]
}

export function QuestlineSection({ canvas }: SectionProps) {
  const [nodes, setNodes] = useState<QuestNode[]>(makeSeed)

  const completed = nodes.filter(isQuestNodeComplete).length
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
      title="The winter route"
      folio="10"
      tilt="right"
    >
      <div className={styles.questDemo}>
        <Questline
          nodes={nodes}
          onChange={setNodes}
          label="Journey of the Hollow Mark"
          addNodeLabel="Add milestone"
        />

        <div className={styles.questFoot}>
          <DemoNote>
            {completed} of {nodes.length} milestones · {done} of {total} tasks.
          </DemoNote>
          <Button
            variant="secondary"
            size="sm"
            iconLeft={<Icon name="scroll" size="sm" />}
            onClick={() => setNodes(makeSeed())}
          >
            Reset
          </Button>
        </div>
      </div>
    </Card>
  )
}
