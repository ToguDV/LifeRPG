import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { FileUploader } from '../src/components/FileUploader/FileUploader'

/*
  BUG-05: the any-file wildcard (star slash star) was parsed as the prefix
  "star slash", so it rejected every file. The remaining cases lock the other
  branches: type wildcard, extension and an explicit MIME list.

  `applyAccept: false` disables the browser pre-filter that user-event applies
  with its own parser: the component has to decide, which is the point here.
*/
function getFileInput(): HTMLInputElement {
  const input = document.querySelector('input[type="file"]')
  if (!(input instanceof HTMLInputElement)) throw new Error('file input not found')
  return input
}

function setup(accept: string) {
  const user = userEvent.setup({ applyAccept: false })
  render(<FileUploader label="Attachments" accept={accept} />)
  return user
}

async function upload(accept: string, file: File) {
  const user = setup(accept)
  await user.upload(getFileInput(), file)
  return user
}

describe('FileUploader accept', () => {
  it('accepts any file with */*', async () => {
    await upload('*/*', new File(['hello'], 'note.txt', { type: 'text/plain' }))

    expect(screen.getByText('note.txt')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('accepts type matches with image/* and rejects the rest', async () => {
    const user = setup('image/*')

    await user.upload(getFileInput(), new File(['png'], 'photo.png', { type: 'image/png' }))
    expect(screen.getByText('photo.png')).toBeInTheDocument()

    await user.upload(getFileInput(), new File(['pdf'], 'report.pdf', { type: 'application/pdf' }))
    expect(screen.getByRole('alert')).toHaveTextContent('“report.pdf” is not an allowed format.')
    expect(screen.queryByText('report.pdf')).not.toBeInTheDocument()
  })

  it('accepts an extension even when the browser reports no MIME type', async () => {
    await upload('.pdf', new File(['pdf'], 'Report.PDF', { type: '' }))

    expect(screen.getByText('Report.PDF')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('honours an explicit MIME list', async () => {
    const user = setup('image/png, image/jpeg')

    await user.upload(getFileInput(), new File(['png'], 'photo.png', { type: 'image/png' }))
    await user.upload(getFileInput(), new File(['gif'], 'drawing.gif', { type: 'image/gif' }))

    expect(screen.getByText('photo.png')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('“drawing.gif” is not an allowed format.')
  })
})

/*
  WCAG 2.5.3: the dropzone is named by the field label and by the visible
  instruction inside it, so a voice-control user can say what they read.
*/
describe('FileUploader accessible name', () => {
  it('includes the field label and the visible instruction', () => {
    render(<FileUploader label="Maps and provisions" />)

    expect(
      screen.getByRole('button', {
        name: /Maps and provisions.*Drag your files here.*browse the shelf/i,
      }),
    ).toBeInTheDocument()
  })

  it('updates the name while the zone is in drag mode', () => {
    render(<FileUploader label="Maps and provisions" />)

    const zone = screen.getByRole('button', { name: /Drag your files here/i })
    fireEvent.dragEnter(zone)

    expect(
      screen.getByRole('button', {
        name: /Maps and provisions.*Drop the files here.*browse the shelf/i,
      }),
    ).toBeInTheDocument()
  })
})
