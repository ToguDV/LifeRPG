import { describe, expect, it } from 'vitest'
import {
  countQuestTasks,
  daysUntilDeadline,
  formatQuestNumber,
  getBlockingNodes,
  getQuestDeadline,
  getQuestNodeStates,
  isQuestNodeComplete,
  parseDeadlineKey,
  type QuestNode,
} from '../src/components/Questline/questline-model'

/* The model works with local calendar days: pin a local time, never UTC. */
const TODAY = new Date(2025, 0, 12, 15, 30)

function milestone(
  id: string,
  title: string,
  overrides: Partial<QuestNode> = {},
): QuestNode {
  return { id, title, tasks: [], ...overrides }
}

function doneTask(id: string): QuestNode['tasks'][number] {
  return { id, title: `Task ${id}`, done: true }
}

function pendingTask(id: string): QuestNode['tasks'][number] {
  return { id, title: `Task ${id}`, done: false }
}

describe('parseDeadlineKey', () => {
  it('parses a valid key as a local date', () => {
    const date = parseDeadlineKey('2025-01-12')

    expect(date).not.toBeNull()
    expect(date?.getFullYear()).toBe(2025)
    expect(date?.getMonth()).toBe(0)
    expect(date?.getDate()).toBe(12)
    expect(date?.getHours()).toBe(0)
  })

  it('accepts 29 February only in a leap year', () => {
    expect(parseDeadlineKey('2024-02-29')).not.toBeNull()
    expect(parseDeadlineKey('2023-02-29')).toBeNull()
  })

  it('rejects invalid, impossible and malformed keys', () => {
    expect(parseDeadlineKey('2025-02-30')).toBeNull()
    expect(parseDeadlineKey('2025-13-01')).toBeNull()
    expect(parseDeadlineKey('2025-00-10')).toBeNull()
    expect(parseDeadlineKey('2025-1-10')).toBeNull()
    expect(parseDeadlineKey('12/01/2025')).toBeNull()
    expect(parseDeadlineKey('')).toBeNull()
    expect(parseDeadlineKey(undefined)).toBeNull()
  })
})

describe('daysUntilDeadline', () => {
  it('counts whole local days around today', () => {
    expect(daysUntilDeadline('2025-01-12', TODAY)).toBe(0)
    expect(daysUntilDeadline('2025-01-13', TODAY)).toBe(1)
    expect(daysUntilDeadline('2025-01-11', TODAY)).toBe(-1)
    expect(daysUntilDeadline('2026-01-12', TODAY)).toBe(365)
  })

  it('returns null for an invalid key', () => {
    expect(daysUntilDeadline('2023-02-29', TODAY)).toBeNull()
  })
})

describe('getQuestNodeStates', () => {
  it('keeps an empty first milestone open but never opens the gate', () => {
    expect(
      getQuestNodeStates(
        [milestone('draft', 'Draft'), milestone('well', 'The well', { tasks: [pendingTask('lantern')] })],
        TODAY,
      ),
    ).toEqual(['active', 'locked'])
  })

  it('keeps completed milestones editable after an earlier one reopens', () => {
    const nodes = [
      milestone('supplies', 'Supplies', { tasks: [pendingTask('skin')] }),
      milestone('well', 'The well', { tasks: [doneTask('lantern')] }),
      milestone('summit', 'The summit', { tasks: [pendingTask('flag')] }),
    ]

    expect(getQuestNodeStates(nodes, TODAY)).toEqual(['active', 'complete', 'locked'])
  })

  it('locks every milestone after the first pending one', () => {
    const nodes = [
      milestone('supplies', 'Supplies', { tasks: [doneTask('skin')] }),
      milestone('well', 'The well', { tasks: [pendingTask('lantern')] }),
      milestone('summit', 'The summit', { tasks: [pendingTask('flag')] }),
    ]

    expect(getQuestNodeStates(nodes, TODAY)).toEqual(['complete', 'active', 'locked'])
  })

  it('marks an unlocked pending milestone as overdue, including an empty draft', () => {
    const nodes = [
      milestone('well', 'The well', {
        deadline: '2025-01-10',
        tasks: [pendingTask('lantern')],
      }),
      milestone('summit', 'The summit', { tasks: [pendingTask('flag')] }),
    ]

    expect(getQuestNodeStates(nodes, TODAY)).toEqual(['overdue', 'locked'])
    expect(
      getQuestNodeStates([milestone('draft', 'Draft', { deadline: '2025-01-10' })], TODAY),
    ).toEqual(['overdue'])
  })

  it('compares deadlines against the given day, not the render clock', () => {
    const nodes = [
      milestone('well', 'The well', {
        deadline: '2025-01-12',
        tasks: [pendingTask('lantern')],
      }),
    ]

    expect(getQuestNodeStates(nodes, new Date(2025, 0, 12, 23, 59))).toEqual(['active'])
    expect(getQuestNodeStates(nodes, new Date(2025, 0, 13, 0, 1))).toEqual(['overdue'])
  })
})

describe('getBlockingNodes', () => {
  it('returns every unfinished milestone behind the index, oldest first', () => {
    const nodes = [
      milestone('supplies', 'Supplies', { tasks: [pendingTask('skin')] }),
      milestone('well', 'The well', { tasks: [pendingTask('lantern')] }),
      milestone('summit', 'The summit', { tasks: [pendingTask('flag')] }),
    ]

    expect(getBlockingNodes(nodes, 2).map((node) => node.id)).toEqual([
      'supplies',
      'well',
    ])
  })

  it('skips finished milestones and stays empty for the first one', () => {
    const nodes = [
      milestone('supplies', 'Supplies', { tasks: [doneTask('skin')] }),
      milestone('well', 'The well', { tasks: [pendingTask('lantern')] }),
      milestone('summit', 'The summit', { tasks: [pendingTask('flag')] }),
    ]

    expect(getBlockingNodes(nodes, 2).map((node) => node.id)).toEqual(['well'])
    expect(getBlockingNodes(nodes, 0)).toEqual([])
  })
})

describe('getQuestDeadline', () => {
  it('has no tone without a deadline or with an invalid one', () => {
    expect(getQuestDeadline(undefined, false, TODAY)).toEqual({
      tone: 'none',
      dateLabel: null,
      shortLabel: 'no date',
      statusLabel: 'No deadline',
    })
    expect(getQuestDeadline('2023-02-29', false, TODAY).tone).toBe('none')
  })

  it('covers every tone on the calendar', () => {
    const done = getQuestDeadline('2025-01-12', true, TODAY)
    expect(done.tone).toBe('done')
    expect(done.statusLabel).toBe('Completed')

    expect(getQuestDeadline('2025-01-11', false, TODAY)).toMatchObject({
      tone: 'overdue',
      statusLabel: 'Overdue',
    })
    expect(getQuestDeadline('2025-01-12', false, TODAY)).toMatchObject({
      tone: 'today',
      statusLabel: 'Due today',
    })
    expect(getQuestDeadline('2025-01-13', false, TODAY)).toMatchObject({
      tone: 'soon',
      statusLabel: 'Due tomorrow',
    })
    expect(getQuestDeadline('2025-01-15', false, TODAY)).toMatchObject({
      tone: 'soon',
      statusLabel: '3 days left',
    })
    expect(getQuestDeadline('2025-01-20', false, TODAY)).toMatchObject({
      tone: 'later',
      statusLabel: '8 days left',
    })
  })

  it('keeps a completed milestone ahead of an overdue date', () => {
    expect(getQuestDeadline('2020-01-01', true, TODAY).tone).toBe('done')
  })

  it('labels the date in long and short form', () => {
    const deadline = getQuestDeadline('2025-01-12', false, TODAY)

    expect(deadline.dateLabel).toContain('2025')
    expect(deadline.shortLabel).toContain('12')
  })
})

describe('task helpers', () => {
  it('counts done and total tasks', () => {
    expect(countQuestTasks(milestone('empty', 'Empty'))).toEqual({ done: 0, total: 0 })
    expect(
      countQuestTasks(
        milestone('well', 'The well', {
          tasks: [doneTask('a'), pendingTask('b'), doneTask('c')],
        }),
      ),
    ).toEqual({ done: 2, total: 3 })
  })

  it('only closes a milestone with at least one task and all of them done', () => {
    expect(isQuestNodeComplete(milestone('empty', 'Empty'))).toBe(false)
    expect(
      isQuestNodeComplete(milestone('well', 'The well', { tasks: [pendingTask('lantern')] })),
    ).toBe(false)
    expect(
      isQuestNodeComplete(
        milestone('well', 'The well', { tasks: [doneTask('a'), doneTask('b')] }),
      ),
    ).toBe(true)
  })
})

describe('formatQuestNumber', () => {
  it('pads the milestone number to two digits', () => {
    expect(formatQuestNumber(1)).toBe('01')
    expect(formatQuestNumber(9)).toBe('09')
    expect(formatQuestNumber(10)).toBe('10')
    expect(formatQuestNumber(123)).toBe('123')
  })
})
