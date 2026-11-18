import {
  useEffect,
  useId,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cx } from '../../lib/cx'
import { formatFileSize } from '../../lib/format'
import { useControllableState } from '../../lib/useControllableState'
import { Field, getFieldMessageId } from '../Field/Field'
import { Icon } from '../Icon/Icon'
import styles from './FileUploader.module.css'

export interface FileUploaderProps {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  optional?: boolean
  labelAside?: ReactNode
  accept?: string
  multiple?: boolean
  maxSize?: number
  maxFiles?: number
  value?: File[]
  defaultValue?: File[]
  onChange?: (files: File[]) => void
  disabled?: boolean
  name?: string
  id?: string
  className?: string
  fieldClassName?: string
}

function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true
  return accept
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule.startsWith('.')) return file.name.toLowerCase().endsWith(rule)
      if (rule.endsWith('/*')) return file.type.toLowerCase().startsWith(rule.slice(0, -1))
      return file.type.toLowerCase() === rule
    })
}

function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`
}

function FilePreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null)
  const isImage = file.type.startsWith('image/')

  useEffect(() => {
    if (!isImage) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file, isImage])

  return (
    <span className={styles.thumb} aria-hidden="true">
      {url ? (
        <img src={url} alt="" className={styles.thumbImage} />
      ) : (
        <Icon name={isImage ? 'image' : 'file'} size="lg" />
      )}
    </span>
  )
}

export function FileUploader({
  label,
  hint,
  error,
  optional,
  labelAside,
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  value,
  defaultValue = [],
  onChange,
  disabled,
  name,
  id,
  className,
  fieldClassName,
}: FileUploaderProps) {
  const autoId = useId()
  const fieldId = id ?? `file-uploader-${autoId}`
  const inputRef = useRef<HTMLInputElement>(null)
  const dragDepth = useRef(0)
  const [dragActive, setDragActive] = useState(false)
  const [issues, setIssues] = useState<string[]>([])

  const [files, setFiles] = useControllableState<File[]>({
    value,
    defaultValue,
    onChange,
  })

  const limit = multiple ? (maxFiles ?? 10) : 1
  const messageId = error
    ? getFieldMessageId(fieldId, 'error')
    : hint
      ? getFieldMessageId(fieldId, 'hint')
      : undefined

  const autoHint = [
    accept ? `Formatos: ${accept}` : null,
    maxSize ? `Máximo ${formatFileSize(maxSize)} por archivo` : null,
    multiple ? `Hasta ${limit} archivos` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const addFiles = (incoming: File[]) => {
    if (disabled || !incoming.length) return

    const nextIssues: string[] = []
    const accepted: File[] = []
    const existingKeys = new Set(files.map(fileKey))

    for (const file of incoming) {
      if (!matchesAccept(file, accept)) {
        nextIssues.push(`«${file.name}» no es un formato permitido.`)
        continue
      }
      if (maxSize && file.size > maxSize) {
        nextIssues.push(`«${file.name}» supera el límite de ${formatFileSize(maxSize)}.`)
        continue
      }
      if (existingKeys.has(fileKey(file))) {
        nextIssues.push(`«${file.name}» ya está en la lista.`)
        continue
      }
      accepted.push(file)
      existingKeys.add(fileKey(file))
    }

    let merged: File[]
    if (multiple) {
      const available = Math.max(0, limit - files.length)
      if (accepted.length > available) {
        nextIssues.push(
          available === 0
            ? `No puedes añadir más de ${limit} ${limit === 1 ? 'archivo' : 'archivos'}.`
            : `Solo se añadieron ${available} de ${accepted.length} archivos por el límite de ${limit}.`,
        )
      }
      merged = [...files, ...accepted.slice(0, available)]
    } else {
      merged = accepted.slice(0, 1)
    }

    setIssues(nextIssues)
    if (accepted.length > 0) setFiles(merged)
  }

  const removeFile = (file: File) => {
    setIssues([])
    setFiles(files.filter((item) => fileKey(item) !== fileKey(file)))
  }

  const openDialog = () => {
    if (!disabled) inputRef.current?.click()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault()
      openDialog()
    }
  }

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (disabled) return
    dragDepth.current += 1
    setDragActive(true)
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragDepth.current = Math.max(0, dragDepth.current - 1)
    if (dragDepth.current === 0) setDragActive(false)
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragDepth.current = 0
    setDragActive(false)
    if (disabled) return
    addFiles(Array.from(event.dataTransfer.files))
  }

  const allIssues = issues

  return (
    <Field
      id={fieldId}
      label={label}
      hint={hint ?? (autoHint || undefined)}
      error={error}
      required={false}
      optional={optional}
      labelAside={
        labelAside ?? (
          <span className={styles.counter}>
            {files.length} / {limit}
          </span>
        )
      }
      className={fieldClassName}
    >
      <input
        ref={inputRef}
        id={fieldId}
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        className={styles.fileInput}
        onChange={(event) => {
          addFiles(Array.from(event.target.files ?? []))
          event.target.value = ''
        }}
      />

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-describedby={messageId}
        data-drag={dragActive ? 'active' : undefined}
        data-disabled={disabled ? 'true' : undefined}
        className={cx(styles.zone, className)}
        onClick={openDialog}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {typeof label === 'string' ? (
          <span className="visually-hidden">{label}. </span>
        ) : null}
        <span className={styles.zoneIcon} aria-hidden="true">
          <Icon name="upload" size="lg" />
        </span>
        <span className={styles.zoneTitle}>
          {dragActive ? 'Suelta aquí los archivos' : 'Arrastra tus archivos aquí'}
        </span>
        <span className={styles.zoneText}>
          o <span className={styles.browse}>elige desde el estante</span>
        </span>
      </div>

      {files.length ? (
        <ul className={styles.files}>
          {files.map((file) => (
            <li key={fileKey(file)} className={styles.file}>
              <FilePreview file={file} />
              <span className={styles.fileInfo}>
                <span className={styles.fileName} title={file.name}>
                  {file.name}
                </span>
                <span className={styles.fileMeta}>{formatFileSize(file.size)}</span>
              </span>
              <button
                type="button"
                className={styles.remove}
                aria-label={`Quitar ${file.name}`}
                onClick={() => removeFile(file)}
                disabled={disabled}
              >
                <Icon name="close" size="xs" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {allIssues.length ? (
        <ul className={styles.issues} role="alert">
          {allIssues.map((issue, index) => (
            <li key={`${issue}-${index}`} className={styles.issue}>
              <Icon name="alert" size="xs" />
              <span>{issue}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Field>
  )
}
