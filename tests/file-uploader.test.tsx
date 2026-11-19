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
  render(<FileUploader label="Adjuntos" accept={accept} />)
  return user
}

async function upload(accept: string, file: File) {
  const user = setup(accept)
  await user.upload(getFileInput(), file)
  return user
}

describe('FileUploader accept', () => {
  it('acepta cualquier archivo con */*', async () => {
    await upload('*/*', new File(['hola'], 'nota.txt', { type: 'text/plain' }))

    expect(screen.getByText('nota.txt')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('acepta coincidencias de tipo con image/* y rechaza el resto', async () => {
    const user = setup('image/*')

    await user.upload(getFileInput(), new File(['png'], 'foto.png', { type: 'image/png' }))
    expect(screen.getByText('foto.png')).toBeInTheDocument()

    await user.upload(getFileInput(), new File(['pdf'], 'informe.pdf', { type: 'application/pdf' }))
    expect(screen.getByRole('alert')).toHaveTextContent('«informe.pdf» no es un formato permitido.')
    expect(screen.queryByText('informe.pdf')).not.toBeInTheDocument()
  })

  it('acepta una extensión aunque el navegador no dé MIME', async () => {
    await upload('.pdf', new File(['pdf'], 'Informe.PDF', { type: '' }))

    expect(screen.getByText('Informe.PDF')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('respeta una lista explícita de MIME', async () => {
    const user = setup('image/png, image/jpeg')

    await user.upload(getFileInput(), new File(['png'], 'foto.png', { type: 'image/png' }))
    await user.upload(getFileInput(), new File(['gif'], 'dibujo.gif', { type: 'image/gif' }))

    expect(screen.getByText('foto.png')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('«dibujo.gif» no es un formato permitido.')
  })
})

/*
  WCAG 2.5.3: the dropzone is named by the field label and by the visible
  instruction inside it, so a voice-control user can say what they read.
*/
describe('FileUploader nombre accesible', () => {
  it('incluye la etiqueta del campo y la instrucción visible', () => {
    render(<FileUploader label="Mapas y provisiones" />)

    expect(
      screen.getByRole('button', {
        name: /Mapas y provisiones.*Arrastra tus archivos aquí.*elige desde el estante/i,
      }),
    ).toBeInTheDocument()
  })

  it('actualiza el nombre cuando la zona está en modo arrastre', () => {
    render(<FileUploader label="Mapas y provisiones" />)

    const zone = screen.getByRole('button', { name: /Arrastra tus archivos aquí/i })
    fireEvent.dragEnter(zone)

    expect(
      screen.getByRole('button', {
        name: /Mapas y provisiones.*Suelta aquí los archivos.*elige desde el estante/i,
      }),
    ).toBeInTheDocument()
  })
})
