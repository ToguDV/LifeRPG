export type DropSide = 'before' | 'after'

/**
 * Moves `id` to the slot beside `anchorId` and returns the new order.
 *
 * `null` means nothing would change: unknown ids, dropping a row on itself or
 * on a neighbour that already holds that side. Callers use it to skip the
 * write and the announcement.
 */
export function moveBeside(
  order: readonly string[],
  id: string,
  anchorId: string,
  side: DropSide,
): string[] | null {
  if (id === anchorId) return null
  if (!order.includes(id) || !order.includes(anchorId)) return null

  const rest = order.filter((value) => value !== id)
  const anchor = rest.indexOf(anchorId)
  const target = anchor + (side === 'after' ? 1 : 0)
  const next = [
    ...rest.slice(0, target),
    id,
    ...rest.slice(target),
  ]
  const unchanged = next.every((value, index) => value === order[index])
  return unchanged ? null : next
}

/** The keyboard step: one slot up (`-1`) or down (`1`), or `null` at the edge. */
export function moveOneStep(
  order: readonly string[],
  id: string,
  step: -1 | 1,
): string[] | null {
  const from = order.indexOf(id)
  const to = from + step
  if (from < 0 || to < 0 || to >= order.length) return null

  const next = [...order]
  next.splice(from, 1)
  next.splice(to, 0, id)
  return next
}

/** Whether two orders hold the same ids in the same slots. */
export function sameOrder(
  a: readonly string[],
  b: readonly string[],
): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index])
}

/**
 * Applies the new relative order of a visible subset to the full collection.
 *
 * A filtered list can only see some of the tasks: dragging promises that the
 * rows on screen end up in the order shown, not that the hidden ones moved.
 * Visible slots are refilled in the new order and every other item keeps its
 * slot, so hiding a filter and reordering never reshuffles what was hidden.
 */
export function applyVisibleOrder<T>(
  items: readonly T[],
  orderedIds: readonly string[],
  getId: (item: T) => string,
): T[] {
  const byId = new Map(items.map((item) => [getId(item), item]))
  const sequence: string[] = []
  const seen = new Set<string>()
  for (const id of orderedIds) {
    if (!byId.has(id) || seen.has(id)) continue
    seen.add(id)
    sequence.push(id)
  }

  let cursor = 0
  return items.map((item) => {
    if (!seen.has(getId(item))) return item
    const nextId = sequence[cursor]
    cursor += 1
    return (nextId && byId.get(nextId)) || item
  })
}
