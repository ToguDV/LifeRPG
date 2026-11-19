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
  const map = 'Navigation chart of the Hollow Mark.\n'.repeat(2200)

  return [
    new File([emblem], 'watchtower.svg', { type: 'image/svg+xml' }),
    new File([map], 'north-map.pdf', { type: 'application/pdf' }),
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
      title="Maps, seals, and provisions"
      description="Drag, drop, or open the shelf. The list shows name and weight; files that fail the filter are explained in red instead of vanishing quietly."
      folio="07"
      tilt="right"
    >
      <DemoGrid>
        <DemoGroup label="Multiple upload" span>
          <FileUploader
            label="Maps and provisions"
            accept="image/*,.pdf"
            multiple
            maxFiles={3}
            maxSize={5 * 1024 * 1024}
            value={files}
            onChange={setFiles}
            hint="Up to three files; images or PDFs, 5 MB max."
          />
          <DemoNote live>
            {files.length} of 3 files in the satchel.
          </DemoNote>
          <DemoNote muted>
            Try dropping a file in another format, or one that is too heavy: the list will
            explain why.
          </DemoNote>
        </DemoGroup>

        <DemoGroup label="Single upload">
          <FileUploader
            label="Guild seal"
            accept="image/png,image/jpeg"
            maxSize={2 * 1024 * 1024}
            hint="PNG or JPG, up to 2 MB. Replaces the previous seal."
          />
        </DemoGroup>

        <DemoGroup label="Disabled state">
          <FileUploader
            label="Sealed file"
            accept=".pdf"
            disabled
            hint="The guild has already closed the register."
          />
        </DemoGroup>
      </DemoGrid>
    </Card>
  )
}
