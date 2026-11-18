import { useState } from 'react'
import { Badge } from '../../components/Badge/Badge'
import { Card } from '../../components/Card/Card'
import { FileUploader } from '../../components/FileUploader/FileUploader'
import { DemoGrid, DemoGroup, DemoNote } from '../Demo'
import type { SectionProps } from '../SectionProps'
import styles from './sections.module.css'

function makeDemoFiles(): File[] {
  const emblem = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
    <rect width="120" height="120" fill="#2c2e28"/>
    <circle cx="60" cy="60" r="42" fill="none" stroke="#c1b69a" stroke-width="2" opacity=".5"/>
    <path d="M60 20c2.4 14.6 11.4 23.6 26 26-14.6 2.4-23.6 11.4-26 26-2.4-14.6-11.4-23.6-26-26 14.6-2.4 23.6-11.4 26-26Z" fill="#c1b69a"/>
  </svg>`
  const map = 'Carta de navegación de la Marca Hueca.\n'.repeat(2200)

  return [
    new File([emblem], 'atalaya.svg', { type: 'image/svg+xml' }),
    new File([map], 'mapa-del-norte.pdf', { type: 'application/pdf' }),
  ]
}

export function FilesSection({ canvas }: SectionProps) {
  const [files, setFiles] = useState<File[]>(makeDemoFiles)

  return (
    <Card
      size="lg"
      surface={canvas}
      kicker={
        <Badge variant="outline" size="sm" className={styles.componentBadge}>
          FileUploader
        </Badge>
      }
      title="Mapas, sellos y provisiones"
      description="Arrastra, suelta o abre el estante. La lista muestra el nombre y el peso; los archivos que no pasan el filtro se explican en rojo en lugar de desaparecer en silencio."
      folio="07"
      tilt="right"
    >
      <DemoGrid>
        <DemoGroup label="Carga múltiple" span>
          <FileUploader
            label="Mapas y provisiones"
            accept="image/*,.pdf"
            multiple
            maxFiles={3}
            maxSize={5 * 1024 * 1024}
            value={files}
            onChange={setFiles}
            hint="Hasta tres archivos; imágenes o PDF de 5 MB como máximo."
          />
          <DemoNote live>
            {files.length} de 3 archivos en el zurrón.
          </DemoNote>
          <DemoNote muted>
            Prueba a soltar un archivo de otro formato o uno demasiado pesado: la lista
            explicará el motivo.
          </DemoNote>
        </DemoGroup>

        <DemoGroup label="Carga única">
          <FileUploader
            label="Sello del gremio"
            accept="image/png,image/jpeg"
            maxSize={2 * 1024 * 1024}
            hint="PNG o JPG, hasta 2 MB. Sustituye el sello anterior."
          />
        </DemoGroup>

        <DemoGroup label="Estado deshabilitado">
          <FileUploader
            label="Archivo sellado"
            accept=".pdf"
            disabled
            hint="El gremio ya cerró el registro."
          />
        </DemoGroup>
      </DemoGrid>
    </Card>
  )
}
