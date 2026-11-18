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
        title="La cera y el hierro"
        description="Cuatro variantes, tres tamaños y los estados que aparecen cuando el invierno aprieta. El botón principal se comporta como un sello de cera; el resto son herramientas de mesa."
        folio="01"
        tilt="left"
      >
        <DemoGrid>
          <DemoGroup label="Variantes" span>
            <DemoRow>
              <Button variant="primary" iconLeft={<Icon name="plus" />}>
                Añadir tarea
              </Button>
              <Button variant="secondary" iconLeft={<Icon name="bookmark" />}>
                Guardar borrador
              </Button>
              <Button variant="ghost" iconRight={<Icon name="chevron-right" />}>
                Ver detalles
              </Button>
              <Button variant="danger" iconLeft={<Icon name="trash" />}>
                Sellar y archivar
              </Button>
            </DemoRow>
          </DemoGroup>

          <DemoGroup label="Tamaños">
            <DemoRow>
              <Button size="sm" variant="secondary">
                Pequeño
              </Button>
              <Button size="md" variant="secondary">
                Mediano
              </Button>
              <Button size="lg" variant="secondary">
                Grande
              </Button>
            </DemoRow>
          </DemoGroup>

          <DemoGroup label="Estados">
            <DemoRow>
              <Button loading>Invocando…</Button>
              <Button disabled>Deshabilitado</Button>
              <Tooltip content="Buscar en el códice">
                <Button iconOnly aria-label="Buscar en el códice" iconLeft={<Icon name="search" />} />
              </Tooltip>
              <Tooltip content="Añadir al diario">
                <Button
                  iconOnly
                  variant="primary"
                  aria-label="Añadir al diario"
                  iconLeft={<Icon name="plus" />}
                />
              </Tooltip>
              <Tooltip content="Eliminar del diario">
                <Button
                  iconOnly
                  variant="danger"
                  aria-label="Eliminar del diario"
                  iconLeft={<Icon name="trash" />}
                />
              </Tooltip>
            </DemoRow>
          </DemoGroup>

          <DemoGroup label="Ancho completo" span>
            <Button
              variant="primary"
              fullWidth
              iconLeft={<Icon name="feather" />}
              onClick={() => setSeals((value) => value + 1)}
            >
              Sellar el diario
            </Button>
            <DemoNote live>
              {seals === 0
                ? 'Aún no has sellado nada.'
                : `Has sellado el diario ${seals} ${seals === 1 ? 'vez' : 'veces'}.`}
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
        title="Una voz al oído"
        description="La pista aparece tras una pausa breve, también al enfocar con el teclado. Nunca tapa el control que la invoca."
        folio="01 b"
        tilt="right"
      >
        <DemoGrid>
          <DemoGroup label="Posición">
            <DemoRow>
              <Tooltip content="El norte no perdona a quien duda.">
                <Button variant="secondary" iconLeft={<Icon name="compass" />}>
                  Brújula
                </Button>
              </Tooltip>
              <Tooltip content="La atalaya arde cada séptima noche." side="bottom">
                <Button variant="ghost" iconLeft={<Icon name="lantern" />}>
                  Atalaya
                </Button>
              </Tooltip>
              <Tooltip content="Un farol prestado al herrero." side="bottom">
                <Button variant="ghost" iconOnly aria-label="Farol" iconLeft={<Icon name="sun" />} />
              </Tooltip>
            </DemoRow>
            <DemoNote muted>Pasa el cursor o llega con Tab.</DemoNote>
          </DemoGroup>
          <DemoGroup label="Nota al margen">
            <p className={styles.aside}>
              Los avisos usan la tinta de panel, incluso sobre papel: son una voz fuera de la
              página, no un objeto de ella.
            </p>
          </DemoGroup>
        </DemoGrid>
      </Card>
    </>
  )
}
