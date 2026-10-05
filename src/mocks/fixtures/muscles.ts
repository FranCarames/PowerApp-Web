import type { MuscleGroupWithMuscles } from '@/api/pending';

// Los grupos musculares y los músculos de demo: los del prototipo. Un grupo trae sus músculos, como
// `GET /muscles/mg/all`. No tienen descripción ni imágenes (son opcionales).
const TIMESTAMP = '2026-03-01T15:00:00.000Z';

const MUSCLES_BY_GROUP: Array<[group: string, muscles: string[]]> = [
  ['Pecho', ['Pectoral mayor']],
  ['Espalda', ['Dorsal ancho', 'Trapecio']],
  ['Piernas', ['Cuádriceps', 'Bíceps femoral', 'Glúteo mayor']],
  ['Hombros', ['Deltoides']],
  ['Brazos', ['Bíceps braquial', 'Tríceps']],
  ['Core', ['Recto abdominal']],
];

const pad = (value: number) => String(value).padStart(2, '0');

let muscleNumber = 0;

export const muscleGroups: MuscleGroupWithMuscles[] = MUSCLES_BY_GROUP.map(
  ([name, muscles], index) => ({
    id: `demo-muscle-group-${pad(index + 1)}`,
    name,
    created_at: TIMESTAMP,
    updated_at: TIMESTAMP,
    muscles: muscles.map((muscleName) => ({
      id: `demo-muscle-${pad(++muscleNumber)}`,
      name: muscleName,
    })),
  }),
);

/** El id de un músculo de demo por su nombre. */
export function muscleIdByName(name: string): string {
  for (const group of muscleGroups) {
    const muscle = group.muscles.find((candidate) => candidate.name === name);
    if (muscle) return muscle.id;
  }
  throw new Error(`No hay un músculo de demo llamado "${name}"`);
}
