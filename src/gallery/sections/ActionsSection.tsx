import { useState } from 'react'
import { Badge } from '../../components/Badge/Badge'
import { Button } from '../../components/Button/Button'
import { Card } from '../../components/Card/Card'
import { Icon } from '../../components/Icon/Icon'
import { Tooltip } from '../../components/Tooltip/Tooltip'
import { DemoGrid, DemoGroup, DemoNote, DemoRow } from '../Demo'
import type { SectionProps } from '../SectionProps'
import styles from './sections.module.css'

export function ActionsSection({ canvas }: SectionProps) {
  const [seals, setSeals] = useState(0)

  return (
    <>
      <Card
        size="lg"
        surface={canvas}
        kicker={
          <Badge variant="outline" size="sm" className={styles.componentBadge}>
            Button
          </Badge>
        }
        title="The wax and the iron"
        folio="01"
        tilt="left"
      >
        <DemoGrid>
          <DemoGroup label="Variants" span>
            <DemoRow>
              <Button variant="primary" iconLeft={<Icon name="plus" />}>
                Add task
              </Button>
              <Button variant="secondary" iconLeft={<Icon name="bookmark" />}>
                Save draft
              </Button>
              <Button variant="ghost" iconRight={<Icon name="chevron-right" />}>
                View details
              </Button>
              <Button variant="danger" iconLeft={<Icon name="trash" />}>
                Seal and archive
              </Button>
            </DemoRow>
          </DemoGroup>

          <DemoGroup label="Sizes">
            <DemoRow>
              <Button size="sm" variant="secondary">
                Small
              </Button>
              <Button size="md" variant="secondary">
                Medium
              </Button>
              <Button size="lg" variant="secondary">
                Large
              </Button>
            </DemoRow>
          </DemoGroup>

          <DemoGroup label="States">
            <DemoRow>
              <Button loading>Summoning…</Button>
              <Button disabled>Disabled</Button>
              <Tooltip content="Search the codex">
                <Button iconOnly aria-label="Search the codex" iconLeft={<Icon name="search" />} />
              </Tooltip>
              <Tooltip content="Add to journal">
                <Button
                  iconOnly
                  variant="primary"
                  aria-label="Add to journal"
                  iconLeft={<Icon name="plus" />}
                />
              </Tooltip>
              <Tooltip content="Remove from journal">
                <Button
                  iconOnly
                  variant="danger"
                  aria-label="Remove from journal"
                  iconLeft={<Icon name="trash" />}
                />
              </Tooltip>
            </DemoRow>
          </DemoGroup>

          <DemoGroup label="Full width" span>
            <Button
              variant="primary"
              fullWidth
              iconLeft={<Icon name="feather" />}
              onClick={() => setSeals((value) => value + 1)}
            >
              Seal the journal
            </Button>
            <DemoNote live>
              {seals === 0
                ? 'Not sealed yet.'
                : `Sealed ${seals} ${seals === 1 ? 'time' : 'times'}.`}
            </DemoNote>
          </DemoGroup>
        </DemoGrid>
      </Card>

      <Card
        size="lg"
        surface={canvas}
        kicker={
          <Badge variant="outline" size="sm" className={styles.componentBadge}>
            Tooltip
          </Badge>
        }
        title="A voice at your ear"
        folio="01 b"
        tilt="right"
      >
        <DemoGroup label="Placement">
          <DemoRow>
            <Tooltip content="The north does not forgive the hesitant.">
              <Button variant="secondary" iconLeft={<Icon name="compass" />}>
                Compass
              </Button>
            </Tooltip>
            <Tooltip content="The watchtower burns every seventh night." side="bottom">
              <Button variant="ghost" iconLeft={<Icon name="lantern" />}>
                Watchtower
              </Button>
            </Tooltip>
            <Tooltip content="A lantern borrowed from the smith." side="bottom">
              <Button variant="ghost" iconOnly aria-label="Lantern" iconLeft={<Icon name="sun" />} />
            </Tooltip>
          </DemoRow>
        </DemoGroup>
      </Card>
    </>
  )
}
