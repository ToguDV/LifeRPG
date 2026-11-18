import { Badge } from '../../components/Badge/Badge'
import { Button } from '../../components/Button/Button'
import { Divider } from '../../components/Divider/Divider'
import { Icon } from '../../components/Icon/Icon'
import { ProgressBar } from '../../components/ProgressBar/ProgressBar'
import { useToast } from '../../components/Toast/Toast'
import { DemoCard } from '../DemoCard'
import { DemoGrid, DemoGroup, DemoNote, DemoRow } from '../Demo'
import type { SectionProps } from '../SectionProps'
import styles from './sections.module.css'

export function ExtrasSection({ canvas }: SectionProps) {
  const toast = useToast()

  return (
    <DemoCard
      canvas={canvas}
      component="Badge · ProgressBar · Divider · Toast"
      title="Señales al borde"
      description="Las piezas que no piden atención hasta que la merecen: etiquetas, medidores, divisores y avisos que entran por la esquina inferior."
      folio="08"
      tilt="left"
    >
      <DemoGrid>
        <DemoGroup label="Etiquetas">
          <DemoRow>
            <Badge variant="neutral" icon={<Icon name="tag" />}>
              Provisiones
            </Badge>
            <Badge variant="accent" dot>
              En curso
            </Badge>
            <Badge variant="success" icon={<Icon name="check" />}>
              Sellada
            </Badge>
            <Badge variant="warning" dot>
              Vence hoy
            </Badge>
            <Badge variant="danger" icon={<Icon name="alert" />}>
              Peligro
            </Badge>
            <Badge variant="outline" size="md">
              Borrador
            </Badge>
          </DemoRow>
        </DemoGroup>

        <DemoGroup label="Medidores">
          <ProgressBar
            label="Experiencia"
            variant="xp"
            value={68}
            max={100}
            hint="Faltan 32 puntos para el nivel 08."
          />
          <ProgressBar
            label="Tareas del día"
            variant="success"
            value={3}
            max={5}
            valueText="3 / 5"
          />
          <ProgressBar
            label="Sello del invierno"
            variant="danger"
            value={86}
            max={100}
            hint="Demasiado cerca de la grieta."
          />
        </DemoGroup>

        <DemoGroup label="Divisores" span>
          <Divider variant="ornament" label="La Marca Hueca" />
          <Divider variant="line" />
        </DemoGroup>

        <DemoGroup label="Notificaciones" span>
          <DemoRow>
            <Button
              variant="secondary"
              iconLeft={<Icon name="check" />}
              onClick={() =>
                toast({
                  variant: 'success',
                  title: 'Tarea sellada',
                  description: '«Llenar el odre» quedó registrada en el diario.',
                })
              }
            >
              Éxito
            </Button>
            <Button
              variant="secondary"
              iconLeft={<Icon name="alert" />}
              onClick={() =>
                toast({
                  variant: 'warning',
                  title: 'El hielo cruje',
                  description: 'Cruzar el vado hoy no es aconsejable.',
                })
              }
            >
              Aviso
            </Button>
            <Button
              variant="danger"
              iconLeft={<Icon name="flame" />}
              onClick={() =>
                toast({
                  variant: 'danger',
                  title: 'Se ha roto el sello',
                  description: 'El farol de latón no volverá esta noche.',
                  duration: 6000,
                })
              }
            >
              Peligro
            </Button>
            <Button
              variant="ghost"
              iconLeft={<Icon name="feather" />}
              onClick={() =>
                toast({
                  variant: 'info',
                  title: 'Nueva página en blanco',
                  description: 'El diario está listo para otra jornada.',
                })
              }
            >
              Información
            </Button>
          </DemoRow>
          <DemoNote muted>
            Los avisos se apilan, se pueden cerrar y se pausan al pasar el cursor.
          </DemoNote>
          <p className={styles.aside}>
            El medidor de experiencia usa la tinta del tema (no la del papel) para que la
            barra conserve su brillo sobre cualquier material.
          </p>
        </DemoGroup>
      </DemoGrid>
    </DemoCard>
  )
}
