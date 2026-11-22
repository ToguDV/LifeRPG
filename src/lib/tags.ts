/**
 * One vocabulary for tags across the journal and the route. The same limits
 * are enforced by the tag picker and by the storage parsers, so a hand-edited
 * journal cannot paint more labels than the UI can edit back.
 */
export const MAX_TAGS = 6
export const MAX_TAG_LENGTH = 24

/** Trims and collapses the spaces inside a tag: “  north   pass ” → “north pass”. */
export function normalizeTag(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

/** Tags are unique regardless of case: “Kit” and “kit” are the same label. */
export function tagKey(tag: string): string {
  return normalizeTag(tag).toLowerCase()
}

/**
 * Defensive read from storage: strings only, cleaned, deduplicated and
 * capped. Returns `undefined` when there is nothing left so the key is not
 * written as an empty list.
 */
export function readTags(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined

  const tags: string[] = []
  const seen = new Set<string>()
  for (const raw of value) {
    if (typeof raw !== 'string') continue
    const tag = normalizeTag(raw).slice(0, MAX_TAG_LENGTH)
    if (!tag) continue
    const key = tagKey(tag)
    if (seen.has(key)) continue
    seen.add(key)
    tags.push(tag)
    if (tags.length === MAX_TAGS) break
  }
  return tags.length ? tags : undefined
}

/** Splits the “one tag per comma” input the tag picker uses to create one. */
export function splitTags(value: string): string[] {
  const tags: string[] = []
  const seen = new Set<string>()
  for (const raw of value.split(',')) {
    const tag = normalizeTag(raw)
    if (!tag) continue
    const key = tagKey(tag)
    if (seen.has(key)) continue
    seen.add(key)
    tags.push(tag)
  }
  return tags
}

/**
 * The global list: every tag in use, once, alphabetically and keeping the
 * first spelling found. Used by the picker so a tag created in the journal
 * is offered in the route and the other way round.
 */
export function mergeTagOptions(...lists: Array<readonly string[]>): string[] {
  const byKey = new Map<string, string>()
  for (const list of lists) {
    for (const raw of list) {
      const tag = normalizeTag(raw)
      if (!tag) continue
      const key = tagKey(tag)
      if (!byKey.has(key)) byKey.set(key, tag)
    }
  }
  return [...byKey.values()].sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: 'base' }),
  )
}
