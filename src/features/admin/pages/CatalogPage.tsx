import { useSearchAndFilter } from '@/shared/lib/useSearchAndFilter';
import { EmptyState, PageHeader, SearchInput, Segmented } from '@/shared/ui';

import { MusclesSection } from '../components/MusclesSection';

const SECTIONS = ['musculos', 'grupos'] as const;

const TITLES = {
  musculos: 'Músculos',
  grupos: 'Grupos musculares',
} as const;

const SEARCH_PLACEHOLDERS = {
  musculos: 'Buscar músculo',
  grupos: 'Buscar grupo muscular',
} as const;

/**
 * Catálogo del Admin: los segmentos Músculos y Grupos musculares (`?seccion=musculos|grupos`, que son
 * los accesos del panel). La búsqueda es una sola para los dos segmentos, como en el prototipo, y
 * queda en la URL (`?q=…`).
 */
export function CatalogPage() {
  const { search, setSearch, filter, setFilter } = useSearchAndFilter(
    'seccion',
    SECTIONS,
  );
  const section = filter ?? 'musculos';

  return (
    <>
      <PageHeader eyebrow="Catálogo" title={TITLES[section]} />
      <Segmented
        label="Ver músculos o grupos musculares"
        value={section}
        options={[
          { value: 'musculos', label: 'Músculos' },
          { value: 'grupos', label: 'Grupos musculares' },
        ]}
        onChange={setFilter}
      />
      <SearchInput
        placeholder={SEARCH_PLACEHOLDERS[section]}
        value={search}
        autoComplete="off"
        onChange={(event) => setSearch(event.target.value)}
      />
      {section === 'musculos' ? (
        <MusclesSection search={search} />
      ) : (
        // TEMPORAL (T33): el segmento Grupos musculares reemplaza este aviso.
        <EmptyState
          icon="list"
          title="Pantalla en construcción"
          message="Los grupos musculares se arman en la tarea T33."
        />
      )}
    </>
  );
}
