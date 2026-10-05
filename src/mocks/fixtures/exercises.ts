import type { Exercise } from '@/api/types';

// Los ejercicios del catálogo de demo: los de la wiki del prototipo y los que usan sus circuitos. Las
// descripciones son cortas; los tips, los videos y las imágenes los suma la tarea de ejercicios.
const TIMESTAMP = '2026-03-02T15:00:00.000Z';

const NAMES: Array<[string, string]> = [
  ['Press de banca', 'Empuje horizontal con barra: pecho, hombros y tríceps.'],
  [
    'Press inclinado mancuernas',
    'Empuje inclinado con mancuernas, con énfasis en el pecho superior.',
  ],
  ['Aperturas', 'Aislamiento del pectoral mayor con mancuernas o poleas.'],
  [
    'Sentadilla',
    'Flexión de cadera y rodilla con barra: cuádriceps, glúteo y core.',
  ],
  ['Prensa', 'Empuje de piernas en máquina, con la espalda apoyada.'],
  ['Extensión de cuádriceps', 'Aislamiento del cuádriceps en máquina.'],
  [
    'Peso muerto',
    'Levantamiento de la barra desde el piso: espalda, glúteo e isquios.',
  ],
  ['Dominadas', 'Tracción vertical con el peso del cuerpo: espalda y bíceps.'],
  ['Remo con barra', 'Tracción horizontal con barra: espalda media.'],
  ['Pull-down polea', 'Tracción vertical en polea alta: dorsal ancho.'],
  ['Curl con barra', 'Flexión de codo con barra: bíceps.'],
  ['Curl de bíceps', 'Flexión de codo con mancuernas: bíceps.'],
  ['Press militar', 'Empuje vertical con barra: hombros y tríceps.'],
  ['Elevaciones laterales', 'Aislamiento del deltoides medio con mancuernas.'],
  ['Plancha', 'Isométrico de core apoyado en antebrazos y puntas de pie.'],
  [
    'Elevaciones de piernas',
    'Flexión de cadera colgado o en banco: abdomen inferior.',
  ],
];

export const exercises: Exercise[] = NAMES.map(
  ([name, description], index) => ({
    id: `demo-exercise-${String(index + 1).padStart(2, '0')}`,
    name,
    description,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
  }),
);
