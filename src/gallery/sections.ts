export interface GallerySectionMeta {
  id: string
  number: string
  title: string
  kicker: string
  note: string
  components: readonly string[]
}

export const SECTIONS = [
  {
    id: 'actions',
    number: '01',
    title: 'Actions',
    kicker: 'Triggers',
    note: 'Wax, iron, and the gesture.',
    components: ['Button', 'Tooltip'],
  },
  {
    id: 'selection',
    number: '02',
    title: 'Selection',
    kicker: 'Decisions',
    note: 'Small marks, long consequences.',
    components: ['Checkbox', 'Radio', 'Switch'],
  },
  {
    id: 'fields',
    number: '03',
    title: 'Text fields',
    kicker: 'Ink',
    note: 'One line or a paragraph; always on paper.',
    components: ['TextInput', 'Textarea'],
  },
  {
    id: 'lists',
    number: '04',
    title: 'Lists',
    kicker: 'Choice',
    note: 'Choosing among what is already written.',
    components: ['Select', 'Combobox'],
  },
  {
    id: 'settings',
    number: '05',
    title: 'Numeric settings',
    kicker: 'Measure',
    note: 'The pulse of the journey, notch by notch.',
    components: ['Slider', 'RangeSlider', 'Stepper'],
  },
  {
    id: 'date-time',
    number: '06',
    title: 'Date and time',
    kicker: 'Time',
    note: 'The calendar and the bell wheel.',
    components: ['DatePicker', 'TimePicker'],
  },
  {
    id: 'files',
    number: '07',
    title: 'Files',
    kicker: 'Provisions',
    note: 'Maps, seals, and letters that weigh.',
    components: ['FileUploader'],
  },
  {
    id: 'extras',
    number: '08',
    title: 'Extras',
    kicker: 'Signals',
    note: 'Tags, meters, and notices at the edge.',
    components: ['Badge', 'ProgressBar', 'Divider', 'Toast'],
  },
  {
    id: 'context',
    number: '09',
    title: 'In context',
    kicker: 'The journal',
    note: 'Every piece, one single task.',
    components: ['TaskList', 'TaskRow', 'TaskEditor', 'TagField', 'EmptyState'],
  },
  {
    id: 'questline',
    number: '10',
    title: 'The journey',
    kicker: 'Route',
    note: 'One path, several milestones, one goal.',
    components: ['Questline', 'QuestNode', 'QuestTask'],
  },
  {
    id: 'containers',
    number: '11',
    title: 'Containers',
    kicker: 'Supports',
    note: 'The paper that keeps paper.',
    components: ['Surface', 'Card', 'WaxSeal'],
  },
] as const satisfies readonly GallerySectionMeta[]

/** Literal ids of `SECTIONS`; the gallery map cannot drift from this list. */
export type SectionId = (typeof SECTIONS)[number]['id']
