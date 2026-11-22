import { Badge } from '../components/Badge/Badge'
import { Card } from '../components/Card/Card'
import { EmptyState } from '../components/EmptyState/EmptyState'
import { Questline } from '../components/Questline/Questline'
import type { QuestNode } from '../components/Questline/Questline'
import type { Dispatch, SetStateAction } from 'react'

export interface QuestJournalProps {
  nodes: QuestNode[]
  setNodes: Dispatch<SetStateAction<QuestNode[]>>
  /** The catalogue shared with the daily list. */
  tagOptions: readonly string[]
}

export function QuestJournal({ nodes, setNodes, tagOptions }: QuestJournalProps) {
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
        tagOptions={tagOptions}
        label="The winter route"
        addNodeLabel="Add milestone"
        newNodeTitle="New milestone"
        emptyState={<EmptyState icon="scroll" title="No milestones yet" />}
      />
    </Card>
  )
}
