import type { ExerciseWithMuscles } from '@/api/pending';

import { muscleById, muscleIdByName, toExerciseMuscle } from './muscles';

// Los ejercicios del catálogo de demo: los de la wiki del prototipo y los que usan sus circuitos, cada
// uno con sus músculos, como los manda `GET /exercise/all`. Los tips y el video los tienen solo algunos
// (el video es una búsqueda en YouTube: no hay imágenes ni videos propios, los links se cargan desde
// el editor del Admin).
const TIMESTAMP = '2026-03-02T15:00:00.000Z';

interface DemoExercise {
  name: string;
  description: string;
  muscles: string[];
  safety_tips?: string;
  activation_tips?: string;
  video_url?: string;
}

const DEMO_EXERCISES: DemoExercise[] = [
  {
    name: 'Press de banca',
    description: 'Empuje horizontal con barra: pecho, hombros y tríceps.',
    muscles: ['Pectoral mayor', 'Tríceps', 'Deltoides'],
    safety_tips:
      'Mantené los codos a 45° del torso y los pies firmes en el piso. Pedí un spotter con cargas altas.',
    activation_tips: 'Apretá el pecho al subir y no rebotes la barra.',
    video_url:
      'https://www.youtube.com/results?search_query=press+de+banca+tecnica',
  },
  {
    name: 'Press inclinado mancuernas',
    description:
      'Empuje inclinado con mancuernas, con énfasis en el pecho superior.',
    muscles: ['Pectoral mayor', 'Deltoides'],
  },
  {
    name: 'Aperturas',
    description: 'Aislamiento del pectoral mayor con mancuernas o poleas.',
    muscles: ['Pectoral mayor'],
  },
  {
    name: 'Sentadilla',
    description:
      'Flexión de cadera y rodilla con barra: cuádriceps, glúteo y core.',
    muscles: ['Cuádriceps', 'Glúteo mayor', 'Recto abdominal'],
    safety_tips:
      'Espalda neutra y rodillas alineadas con los pies. No dejes que se junten al subir.',
    activation_tips: 'Empujá el piso con todo el pie y abrí las rodillas.',
    video_url:
      'https://www.youtube.com/results?search_query=sentadilla+tecnica',
  },
  {
    name: 'Prensa',
    description: 'Empuje de piernas en máquina, con la espalda apoyada.',
    muscles: ['Cuádriceps', 'Glúteo mayor'],
  },
  {
    name: 'Extensión de cuádriceps',
    description: 'Aislamiento del cuádriceps en máquina.',
    muscles: ['Cuádriceps'],
  },
  {
    name: 'Peso muerto',
    description:
      'Levantamiento de la barra desde el piso: espalda, glúteo e isquios.',
    muscles: ['Dorsal ancho', 'Trapecio', 'Bíceps femoral', 'Glúteo mayor'],
    safety_tips:
      'Espalda recta durante todo el movimiento. La barra va pegada a las piernas.',
    video_url:
      'https://www.youtube.com/results?search_query=peso+muerto+tecnica',
  },
  {
    name: 'Dominadas',
    description: 'Tracción vertical con el peso del cuerpo: espalda y bíceps.',
    muscles: ['Dorsal ancho', 'Bíceps braquial'],
  },
  {
    name: 'Remo con barra',
    description: 'Tracción horizontal con barra: espalda media.',
    muscles: ['Dorsal ancho', 'Trapecio'],
  },
  {
    name: 'Pull-down polea',
    description: 'Tracción vertical en polea alta: dorsal ancho.',
    muscles: ['Dorsal ancho', 'Bíceps braquial'],
  },
  {
    name: 'Curl con barra',
    description: 'Flexión de codo con barra: bíceps.',
    muscles: ['Bíceps braquial'],
  },
  {
    name: 'Curl de bíceps',
    description: 'Flexión de codo con mancuernas: bíceps.',
    muscles: ['Bíceps braquial'],
  },
  {
    name: 'Press militar',
    description: 'Empuje vertical con barra: hombros y tríceps.',
    muscles: ['Deltoides', 'Tríceps'],
  },
  {
    name: 'Elevaciones laterales',
    description: 'Aislamiento del deltoides medio con mancuernas.',
    muscles: ['Deltoides'],
  },
  {
    name: 'Plancha',
    description: 'Isométrico de core apoyado en antebrazos y puntas de pie.',
    muscles: ['Recto abdominal'],
  },
  {
    name: 'Elevaciones de piernas',
    description: 'Flexión de cadera colgado o en banco: abdomen inferior.',
    muscles: ['Recto abdominal'],
  },
];

export const exercises: ExerciseWithMuscles[] = DEMO_EXERCISES.map(
  ({ muscles, ...exercise }, index) => ({
    ...exercise,
    id: `demo-exercise-${String(index + 1).padStart(2, '0')}`,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
    exercisedMuscles: muscles.flatMap((name) => {
      const muscle = muscleById(muscleIdByName(name));
      return muscle ? [toExerciseMuscle(muscle)] : [];
    }),
  }),
);

/**
 * Los ejercicios que el backend no deja borrar porque tienen RMs o entrenamientos hechos: los del
 * prototipo con más uso. El resto se puede borrar.
 */
export const EXERCISES_IN_USE: readonly string[] = [
  exercises[0].id,
  exercises[3].id,
];
