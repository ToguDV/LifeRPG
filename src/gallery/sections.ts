export interface GallerySectionMeta {
  id: string
  number: string
  title: string
  kicker: string
  note: string
  components: string[]
}

export const SECTIONS: readonly GallerySectionMeta[] = [
  {
    id: 'acciones',
    number: '01',
    title: 'Acciones',
    kicker: 'Disparadores',
    note: 'La cera, el hierro y el gesto.',
    components: ['Button', 'Tooltip'],
  },
  {
    id: 'seleccion',
    number: '02',
    title: 'Selección',
    kicker: 'Decisiones',
    note: 'Marcas pequeñas, consecuencias largas.',
    components: ['Checkbox', 'Radio', 'Switch'],
  },
  {
    id: 'campos',
    number: '03',
    title: 'Campos de texto',
    kicker: 'Tinta',
    note: 'Una línea o un párrafo; siempre sobre papel.',
    components: ['TextInput', 'Textarea'],
  },
  {
    id: 'listas',
    number: '04',
    title: 'Listas',
    kicker: 'Elección',
    note: 'Escoger entre lo ya escrito.',
    components: ['Select', 'Combobox'],
  },
  {
    id: 'ajustes',
    number: '05',
    title: 'Ajustes numéricos',
    kicker: 'Medida',
    note: 'El pulso del viaje, grado a grado.',
    components: ['Slider', 'RangeSlider', 'Stepper'],
  },
  {
    id: 'fecha-hora',
    number: '06',
    title: 'Fecha y hora',
    kicker: 'El tiempo',
    note: 'El calendario y la rueda de campanas.',
    components: ['DatePicker', 'TimePicker'],
  },
  {
    id: 'archivos',
    number: '07',
    title: 'Archivos',
    kicker: 'Provisiones',
    note: 'Mapas, sellos y cartas que pesan.',
    components: ['FileUploader'],
  },
  {
    id: 'complementos',
    number: '08',
    title: 'Complementos',
    kicker: 'Señales',
    note: 'Etiquetas, medidores y avisos al borde.',
    components: ['Badge', 'ProgressBar', 'Divider', 'Toast'],
  },
  {
    id: 'contexto',
    number: '09',
    title: 'En contexto',
    kicker: 'El diario',
    note: 'Todas las piezas, una sola tarea.',
    components: ['TaskList', 'TaskRow', 'EmptyState'],
  },
  {
    id: 'contenedores',
    number: '10',
    title: 'Contenedores',
    kicker: 'Soportes',
    note: 'El papel que guarda al papel.',
    components: ['Surface', 'Card', 'WaxSeal'],
  },
] as const
