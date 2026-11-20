import { describe, expect, it } from 'vitest'
import {
  QUESTS_KEY,
  TASKS_KEY,
  parseNodes,
  parseTasks,
} from '../src/journal/journal-data'

describe('journal storage keys', () => {
  it('keeps the two journals on their own versioned keys', () => {
    expect(TASKS_KEY).toBe('liferpg-journal-tasks-v1')
    expect(QUESTS_KEY).toBe('liferpg-journal-quests-v1')
    expect(TASKS_KEY).not.toBe(QUESTS_KEY)
  })
})

describe('parseTasks', () => {
  it('rejects only a payload that is not an array', () => {
    expect(parseTasks(null)).toBeNull()
    expect(parseTasks(undefined)).toBeNull()
    expect(parseTasks('[]')).toBeNull()
    expect(parseTasks({})).toBeNull()
  })

  it('accepts an empty journal', () => {
    expect(parseTasks([])).toEqual([])
  })

  it('salvages the valid records and skips the rest', () => {
    const tasks = parseTasks([
      { id: 'a', title: 'Fill the waterskin', done: false },
      'not a task',
      { id: 'b', title: 'Untitled', done: 'true' },
      { id: '', title: 'No id', done: false },
      { id: 'c', title: '   ', done: false },
      { id: 'd', title: 'Seal the map', done: true },
    ])

    expect(tasks).toEqual([
      { id: 'a', title: 'Fill the waterskin', done: false },
      { id: 'd', title: 'Seal the map', done: true },
    ])
  })

  it('keeps the known optional fields and drops anything else', () => {
    const [task] = parseTasks([
      {
        id: 'a',
        title: 'Fill the waterskin',
        done: false,
        note: 'A long way down',
        due: 'Before dusk',
        tag: 'Survival',
        overdue: true,
        priority: 'high',
        colour: 'red',
        xp: 12,
      },
    ]) ?? []

    expect(task).toEqual({
      id: 'a',
      title: 'Fill the waterskin',
      done: false,
      note: 'A long way down',
      due: 'Before dusk',
      tag: 'Survival',
      overdue: true,
      priority: 'high',
    })
  })

  it('rejects duplicate ids so one edit cannot rewrite two rows', () => {
    const tasks = parseTasks([
      { id: 'a', title: 'First', done: false },
      { id: 'a', title: 'Second', done: true },
    ])

    expect(tasks).toEqual([{ id: 'a', title: 'First', done: false }])
  })
})

describe('parseNodes', () => {
  it('rejects only a payload that is not an array', () => {
    expect(parseNodes(null)).toBeNull()
    expect(parseNodes('[]')).toBeNull()
    expect(parseNodes({ nodes: [] })).toBeNull()
  })

  it('accepts an empty route', () => {
    expect(parseNodes([])).toEqual([])
  })

  it('salvages the valid milestones and skips the rest', () => {
    const nodes = parseNodes([
      {
        id: 'provisiones',
        title: 'The provisions',
        tasks: [{ id: 'odre', title: 'Fill the waterskin', done: true }],
      },
      { id: 'pozo' },
      { id: '', title: 'No id', tasks: [] },
      { id: 'sin-tareas', title: 'No task list' },
      {
        id: 'pozo',
        title: 'The blind well',
        deadline: 'next tuesday',
        note: 'Bring rope',
        tasks: [
          { id: 'cuerda', title: 'Tie the rope', done: false },
          'not a quest',
          { id: 'cuerda', title: 'Tie it again', done: true },
          { id: 'farol', title: 'Lower the lantern', done: 'no' },
          { id: 'cubo', title: 'Raise the bucket', done: false },
        ],
      },
    ])

    expect(nodes).toEqual([
      {
        id: 'provisiones',
        title: 'The provisions',
        tasks: [{ id: 'odre', title: 'Fill the waterskin', done: true }],
      },
      {
        id: 'pozo',
        title: 'The blind well',
        note: 'Bring rope',
        tasks: [
          { id: 'cuerda', title: 'Tie the rope', done: false },
          { id: 'cubo', title: 'Raise the bucket', done: false },
        ],
      },
    ])
  })

  it('drops duplicate milestone ids, keeping the first', () => {
    const nodes = parseNodes([
      { id: 'pozo', title: 'The blind well', tasks: [] },
      { id: 'pozo', title: 'A second well', tasks: [] },
    ])

    expect(nodes).toEqual([{ id: 'pozo', title: 'The blind well', tasks: [] }])
  })

  it('keeps a milestone whose only problems are inside its quest list', () => {
    const nodes = parseNodes([
      {
        id: 'pozo',
        title: 'The blind well',
        tasks: [{ id: 'farol', title: 'Lower the lantern', done: true }],
      },
    ])

    expect(nodes).toHaveLength(1)
    expect(nodes?.[0].tasks).toHaveLength(1)
  })
})
