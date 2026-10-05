import { useId, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import type {
  ExerciseMuscle,
  ExerciseWithMuscles,
  MuscleGroupWithMuscles,
} from '@/api/pending';
import { zodResolver } from '@/shared/lib/zodResolver';
import {
  Button,
  Chip,
  ChipGroup,
  Field,
  Input,
  Note,
  Textarea,
  useToast,
} from '@/shared/ui';

import { useSaveExercise } from '../hooks/useSaveExercise';
import { exerciseSchema, type ExerciseValues } from '../schemas';
import styles from './ExerciseForm.module.css';
import { MusclePickerModal } from './MusclePickerModal';

interface ExerciseFormProps {
  /** El ejercicio a editar. Sin él, el formulario da de alta uno nuevo. */
  exercise?: ExerciseWithMuscles;
  groups: readonly MuscleGroupWithMuscles[];
}

function defaultValues(exercise?: ExerciseWithMuscles): ExerciseValues {
  return {
    name: exercise?.name ?? '',
    description: exercise?.description ?? '',
    exercised_muscles_ids:
      exercise?.exercisedMuscles.map((muscle) => muscle.id) ?? [],
    safety_tips: exercise?.safety_tips ?? '',
    activation_tips: exercise?.activation_tips ?? '',
    video_url: exercise?.video_url ?? '',
    preview_image: exercise?.preview_image ?? '',
    bg_image: exercise?.bg_image ?? '',
  };
}

/** El nombre de cada músculo, de los grupos y de los que ya trae el ejercicio. */
function muscleNames(
  groups: readonly MuscleGroupWithMuscles[],
  exercise?: ExerciseWithMuscles,
) {
  const names = new Map<string, string>();
  const muscles: Array<Pick<ExerciseMuscle, 'id' | 'name'>> = [
    ...(exercise?.exercisedMuscles ?? []),
    ...groups.flatMap((group) => group.muscles),
  ];
  for (const { id, name } of muscles) names.set(id, name);
  return names;
}

/**
 * El formulario de un ejercicio (CU-A-04 y CU-A-05), con los músculos que trabaja como chips para
 * agregar y quitar (CU-A-02 y CU-A-03). Las imágenes y el video son links: el backend no tiene
 * endpoint de subida.
 */
export function ExerciseForm({ exercise, groups }: ExerciseFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const save = useSaveExercise(exercise?.id);
  const [picking, setPicking] = useState(false);
  const musclesLabelId = useId();

  const schema = useMemo(
    () =>
      exerciseSchema({
        safety_tips: exercise?.safety_tips,
        activation_tips: exercise?.activation_tips,
        video_url: exercise?.video_url,
        preview_image: exercise?.preview_image,
        bg_image: exercise?.bg_image,
      }),
    [exercise],
  );
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm<ExerciseValues>({
    resolver: zodResolver(schema),
    // Con `values`, si el ejercicio cambia en el servidor (el caché estaba viejo y llega el dato
    // nuevo) el formulario se pone al día, sin pisar lo que ya se escribió.
    values: defaultValues(exercise),
    resetOptions: { keepDirtyValues: true },
  });

  const names = muscleNames(groups, exercise);
  const muscleIds = useWatch({ control, name: 'exercised_muscles_ids' });

  function setMuscleIds(next: string[]) {
    // Antes del primer envío no se marca el error: el formulario recién empieza.
    setValue('exercised_muscles_ids', next, {
      shouldDirty: true,
      shouldValidate: isSubmitted,
    });
  }

  const onSubmit = handleSubmit((values) => {
    if (save.isPending) return;
    save.mutate(values, {
      onSuccess: () => {
        toast.success(exercise ? 'Ejercicio guardado' : 'Ejercicio creado');
        navigate('/a/ejercicios');
      },
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      {save.isError && (
        <Note tone="err" icon="alert" role="alert" className={styles.error}>
          {getErrorMessage(save.error, {
            404: 'No encontramos el ejercicio o alguno de sus músculos. Recargá la pantalla e intentá de nuevo.',
          })}
        </Note>
      )}
      <Field label="Nombre" error={errors.name?.message}>
        <Input
          maxLength={50}
          autoComplete="off"
          placeholder="Ej: Press de banca"
          {...register('name')}
        />
      </Field>
      <Field label="Descripción" error={errors.description?.message}>
        <Textarea
          maxLength={2000}
          placeholder="Cómo se ejecuta el ejercicio"
          {...register('description')}
        />
      </Field>
      <div className={styles.muscles}>
        <span id={musclesLabelId} className={styles.label}>
          Músculos trabajados
        </span>
        <ChipGroup wrap aria-labelledby={musclesLabelId}>
          {muscleIds.map((id) => {
            const name = names.get(id) ?? 'Músculo';
            return (
              <Chip
                key={id}
                tone="acc"
                selected
                aria-pressed={undefined}
                aria-label={`Quitar ${name}`}
                onClick={() =>
                  setMuscleIds(muscleIds.filter((current) => current !== id))
                }
              >
                {name} ✕
              </Chip>
            );
          })}
          <Chip onClick={() => setPicking(true)}>+ Agregar</Chip>
        </ChipGroup>
        {errors.exercised_muscles_ids?.message && (
          <div role="alert" className={styles.muscleError}>
            {errors.exercised_muscles_ids.message}
          </div>
        )}
      </div>
      <Field
        label="Tips de seguridad"
        error={errors.safety_tips?.message}
        hint="Opcional."
      >
        <Textarea
          maxLength={500}
          placeholder="Indicaciones para evitar lesiones"
          {...register('safety_tips')}
        />
      </Field>
      <Field
        label="Tips de activación"
        error={errors.activation_tips?.message}
        hint="Opcional."
      >
        <Textarea
          maxLength={500}
          placeholder="Cómo sentir el músculo trabajando"
          {...register('activation_tips')}
        />
      </Field>
      <Field
        label="Video (link)"
        error={errors.video_url?.message}
        hint="Opcional."
      >
        <Input
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="https://youtube.com/…"
          {...register('video_url')}
        />
      </Field>
      <Field
        label="Imagen de vista previa (link)"
        error={errors.preview_image?.message}
        hint="Opcional. La miniatura que se ve en las listas."
      >
        <Input
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="https://…"
          {...register('preview_image')}
        />
      </Field>
      <Field
        label="Imagen de fondo (link)"
        error={errors.bg_image?.message}
        hint="Opcional. La imagen grande de la ficha del ejercicio."
      >
        <Input
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="https://…"
          {...register('bg_image')}
        />
      </Field>
      <Button type="submit" loading={save.isPending}>
        Guardar ejercicio
      </Button>
      <MusclePickerModal
        open={picking}
        groups={groups}
        selectedIds={muscleIds}
        onPick={(id) => {
          setMuscleIds([...muscleIds, id]);
          setPicking(false);
        }}
        onClose={() => setPicking(false)}
      />
    </form>
  );
}
