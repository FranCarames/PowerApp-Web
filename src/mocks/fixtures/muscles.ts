import type {
  ExerciseMuscle,
  MuscleGroupWithMuscles,
  MuscleWithGroup,
} from '@/api/pending';
import type { MuscleGroup } from '@/api/types';

// Los grupos musculares y los músculos de demo: los del prototipo, con la descripción de algunos. Es
// el estado que comparten los mocks de ejercicios y de músculos (lo que el Admin crea, edita o borra
// se ve en las dos pantallas hasta que se recarga la página), por eso son listas que se mutan.
const TIMESTAMP = '2026-03-01T15:00:00.000Z';

export interface DemoMuscle {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  image_url?: string;
  preview_image?: string;
}

const MUSCLES_BY_GROUP: Array<
  [group: string, muscles: Array<[name: string, description?: string]>]
> = [
  ['Pecho', [['Pectoral mayor', 'Músculo principal del pecho.']]],
  [
    'Espalda',
    [
      ['Dorsal ancho', 'El más ancho de la espalda: tracciona y estabiliza.'],
      ['Trapecio'],
    ],
  ],
  [
    'Piernas',
    [
      ['Cuádriceps', 'Frente del muslo: extiende la rodilla.'],
      ['Bíceps femoral'],
      ['Glúteo mayor'],
    ],
  ],
  ['Hombros', [['Deltoides']]],
  ['Brazos', [['Bíceps braquial'], ['Tríceps']]],
  ['Core', [['Recto abdominal']]],
];

const pad = (value: number) => String(value).padStart(2, '0');

export const demoMuscleGroups: MuscleGroup[] = MUSCLES_BY_GROUP.map(
  ([name], index) => ({
    id: `demo-muscle-group-${pad(index + 1)}`,
    name,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
  }),
);

export const demoMuscles: DemoMuscle[] = MUSCLES_BY_GROUP.flatMap(
  ([, muscles], groupIndex) =>
    muscles.map(([name, description]) => ({
      name,
      description,
      groupId: demoMuscleGroups[groupIndex].id,
    })),
).map((muscle, index) => ({ ...muscle, id: `demo-muscle-${pad(index + 1)}` }));

export function muscleById(id: string): DemoMuscle | undefined {
  return demoMuscles.find((muscle) => muscle.id === id);
}

/** El id de un músculo de demo por su nombre. */
export function muscleIdByName(name: string): string {
  const muscle = demoMuscles.find((candidate) => candidate.name === name);
  if (!muscle) throw new Error(`No hay un músculo de demo llamado "${name}"`);
  return muscle.id;
}

/** Un músculo como lo trae un ejercicio en `exercisedMuscles`. */
export function toExerciseMuscle(muscle: DemoMuscle): ExerciseMuscle {
  return {
    id: muscle.id,
    name: muscle.name,
    description: muscle.description,
    image_url: muscle.image_url,
    preview_image: muscle.preview_image,
  };
}

/** `GET /muscles/mg/all`: cada grupo con sus músculos. */
export function groupsWithMuscles(): MuscleGroupWithMuscles[] {
  return demoMuscleGroups.map((group) => ({
    ...group,
    muscles: demoMuscles
      .filter((muscle) => muscle.groupId === group.id)
      .map(({ id, name, description }) => ({ id, name, description })),
  }));
}

/** `GET /muscles/all`: cada músculo con su grupo anidado. */
export function musclesWithGroup(): MuscleWithGroup[] {
  return demoMuscles.flatMap((muscle) => {
    const group = demoMuscleGroups.find(({ id }) => id === muscle.groupId);
    if (!group) return [];
    return [
      {
        id: muscle.id,
        name: muscle.name,
        description: muscle.description,
        image_url: muscle.image_url,
        preview_image: muscle.preview_image,
        muscle_group: { id: group.id, name: group.name },
      },
    ];
  });
}
