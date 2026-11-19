import { Badge } from '../../components/Badge/Badge'
import { Button } from '../../components/Button/Button'
import { Card } from '../../components/Card/Card'
import { Divider } from '../../components/Divider/Divider'
import { Icon } from '../../components/Icon/Icon'
import { ProgressBar } from '../../components/ProgressBar/ProgressBar'
import { useToast } from '../../components/Toast/Toast'
import { DemoGrid, DemoGroup, DemoNote, DemoRow } from '../Demo'
import type { SectionProps } from '../SectionProps'
import styles from './sections.module.css'

export function ExtrasSection({ canvas }: SectionProps) {
  const toast = useToast()

  return (
    <Card
      size="lg"
      surface={canvas}
      kicker={
        <Badge variant="outline" size="sm" className={styles.componentBadge}>
          Badge · ProgressBar · Divider · Toast
        </Badge>
      }
      title="Signals at the edge"
      description="The pieces that ask for nothing until they earn it: tags, meters, dividers, and notices that come in from the lower corner."
      folio="08"
      tilt="left"
    >
      <DemoGrid>
        <DemoGroup label="Tags">
          <DemoRow>
            <Badge variant="neutral" icon={<Icon name="tag" />}>
              Provisions
            </Badge>
            <Badge variant="accent" dot>
              In progress
            </Badge>
            <Badge variant="success" icon={<Icon name="check" />}>
              Sealed
            </Badge>
            <Badge variant="warning" dot>
              Due today
            </Badge>
            <Badge variant="danger" icon={<Icon name="alert" />}>
              Danger
            </Badge>
            <Badge variant="outline" size="md">
              Draft
            </Badge>
          </DemoRow>
        </DemoGroup>

        <DemoGroup label="Meters">
          <ProgressBar
            label="Experience"
            variant="xp"
            value={68}
            max={100}
            hint="32 points to level 08."
          />
          <ProgressBar
            label="Tasks today"
            variant="success"
            value={3}
            max={5}
            valueText="3 / 5"
          />
          <ProgressBar
            label="Winter seal"
            variant="danger"
            value={86}
            max={100}
            hint="Too close to the crack."
          />
        </DemoGroup>

        <DemoGroup label="Dividers" span>
          <Divider variant="ornament" label="The Hollow Mark" />
          <Divider variant="line" />
        </DemoGroup>

        <DemoGroup label="Notices" span>
          <DemoRow>
            <Button
              variant="secondary"
              iconLeft={<Icon name="check" />}
              onClick={() =>
                toast({
                  variant: 'success',
                  title: 'Task sealed',
                  description: '“Fill the waterskin” is on record in the journal.',
                })
              }
            >
              Success
            </Button>
            <Button
              variant="secondary"
              iconLeft={<Icon name="alert" />}
              onClick={() =>
                toast({
                  variant: 'warning',
                  title: 'The ice is creaking',
                  description: 'Crossing the ford today is not advisable.',
                })
              }
            >
              Warning
            </Button>
            <Button
              variant="danger"
              iconLeft={<Icon name="flame" />}
              onClick={() =>
                toast({
                  variant: 'danger',
                  title: 'The seal has broken',
                  description: 'The brass lantern will not return tonight.',
                  duration: 6000,
                })
              }
            >
              Danger
            </Button>
            <Button
              variant="ghost"
              iconLeft={<Icon name="feather" />}
              onClick={() =>
                toast({
                  variant: 'info',
                  title: 'A new blank page',
                  description: 'The journal is ready for another day.',
                })
              }
            >
              Information
            </Button>
          </DemoRow>
          <DemoNote muted>
            Notices stack, can be dismissed, and pause on hover.
          </DemoNote>
          <p className={styles.aside}>
            The experience meter uses theme ink (not paper ink) so the bar keeps its glow
            on any material.
          </p>
        </DemoGroup>
      </DemoGrid>
    </Card>
  )
}
