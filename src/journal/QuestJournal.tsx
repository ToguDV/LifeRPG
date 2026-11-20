import { Badge } from '../components/Badge/Badge'
import { Card } from '../components/Card/Card'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { Questline } from '../components/Questline/Questline'
import type { QuestNode } from '../components/Questline/Questline'
import { usePersistentState } from '../lib/usePersistentState'
import { QUESTS_KEY, parseNodes, seedNodes } from './journal-data'

export function QuestJournal() {
  const [nodes, setNodes] = usePersistentState<QuestNode[]>(
    QUESTS_KEY,
    seedNodes,
    parseNodes,
  )

  return (
    <Card
      size="lg"
      surface="panel"
      kicker={
        <Badge variant="outline" size="sm">
          Questline
        </Badge>
      }
      title="The route"
      folio="II"
    >
      <Questline
        nodes={nodes}
        onChange={setNodes}
        label="The winter route"
        addNodeLabel="Add milestone"
        newNodeTitle="New milestone"
        emptyState={<EmptyState icon="scroll" title="No milestones yet" />}
      />
    </Card>
  )
}
