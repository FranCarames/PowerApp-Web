import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router';

import { api, request } from '@/api/client';
import { API_URL } from '@/api/config';
import { getErrorMessage, isApiError } from '@/api/errors';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  List,
  ListItem,
  ListSkeleton,
  Note,
  Pill,
  Tile,
} from '@/shared/ui';

import styles from './ApiProbePage.module.css';
import { GallerySection } from './GallerySection';
import pageStyles from './UiGallery.module.css';
import { useMembershipsProbe } from './useMembershipsProbe';

const price = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

/** Lo que el backend dijo de verdad: para diagnosticar, no para mostrarle al usuario. */
function ErrorDetails({ error }: { error: unknown }) {
  if (!isApiError(error)) {
    return <p className={styles.details}>{String(error)}</p>;
  }
  return (
    <p className={styles.details}>
      <span>tipo: {error.kind}</span>
      <span>estado: {error.status || '—'}</span>
      <span>con token: {error.authenticated ? 'sí' : 'no'}</span>
      <span>mensaje del backend: {error.serverMessage ?? '—'}</span>
    </p>
  );
}

interface ErrorProbeProps {
  title: string;
  endpoint: string;
  expected: string;
  run: () => Promise<unknown>;
}

/** Un request que se espera que falle, para ver cómo llega el error y cómo se traduce. */
function ErrorProbe({ title, endpoint, expected, run }: ErrorProbeProps) {
  const probe = useMutation({ mutationFn: run });

  return (
    <Card>
      <div className={styles.probeHead}>
        <div>
          <div className={styles.probeTitle}>{title}</div>
          <code className={styles.endpoint}>{endpoint}</code>
        </div>
        <Button
          sm
          variant="sec"
          loading={probe.isPending}
          onClick={() => probe.mutate()}
        >
          Probar
        </Button>
      </div>
      <p className={styles.expected}>Esperado: {expected}</p>
      {probe.isError && (
        <>
          <Note tone="warn" icon="alert">
            {getErrorMessage(probe.error)}
          </Note>
          <ErrorDetails error={probe.error} />
        </>
      )}
      {probe.isSuccess && (
        <Note tone="ok" icon="check">
          Respondió bien, o sea que no era lo esperado.
        </Note>
      )}
    </Card>
  );
}

/** Solo desarrollo: prueba la capa de API contra el backend, sin pasar por ninguna pantalla real. */
export function ApiProbePage() {
  const { token } = useAuth();
  const memberships = useMembershipsProbe();

  return (
    <main className={pageStyles.page}>
      <p className={pageStyles.eyebrow}>Solo desarrollo · /dev/api</p>
      <h1 className={pageStyles.title}>Prueba de la API</h1>
      <p className={pageStyles.intro}>
        Llama al backend con el cliente real (<code>src/api/client.ts</code>) y
        muestra lo que le llegaría a una pantalla: el dato, o el mensaje en
        español de cada error. <Link to="/">Volver al inicio</Link>
      </p>

      <GallerySection id="configuracion" title="Configuración">
        <dl className={styles.config}>
          <dt>Origen de la API</dt>
          <dd>
            {API_URL || (
              <>
                mismo origen: Vite reenvía <code>/api</code> al backend
              </>
            )}
          </dd>
          <dt>Mocks (MSW)</dt>
          <dd>
            {import.meta.env.VITE_USE_MOCKS === 'true'
              ? 'activados'
              : 'apagados'}
          </dd>
          <dt>Sesión</dt>
          <dd>
            {token
              ? 'con token: se manda en los endpoints que lo piden'
              : 'sin sesión'}
          </dd>
        </dl>
      </GallerySection>

      <GallerySection
        id="membresias"
        title="Listar membresías"
        description="GET /api/v1/membership/all es público, así que anda sin sesión."
      >
        {memberships.isPending ? (
          <>
            <ListSkeleton rows={2} />
            {memberships.failureCount > 0 && (
              <p className={styles.details}>
                Reintentando… ya fallaron {memberships.failureCount}
              </p>
            )}
          </>
        ) : memberships.isError ? (
          <>
            <ErrorState
              title="No pudimos cargar las membresías"
              message={getErrorMessage(memberships.error)}
              onRetry={() => void memberships.refetch()}
              retrying={memberships.isRefetching}
            />
            <ErrorDetails error={memberships.error} />
          </>
        ) : memberships.data.length === 0 ? (
          <EmptyState
            icon="wallet"
            message="El backend respondió bien, pero no hay tipos de membresía."
          />
        ) : (
          <List>
            {memberships.data.map((membership) => (
              <ListItem
                key={membership.id}
                leading={
                  <Tile icon="wallet" tone={membership.active ? 'ok' : 'mut'} />
                }
                title={membership.name}
                subtitle={`${membership.duration} días`}
                trailing={
                  <>
                    <span className={styles.price}>
                      {price.format(membership.price)}
                    </span>
                    {!membership.active && <Pill tone="warn">Inactiva</Pill>}
                  </>
                }
              />
            ))}
          </List>
        )}
      </GallerySection>

      <GallerySection
        id="errores"
        title="Errores"
        description="Cada prueba espera un error: se ve el mensaje que recibiría el usuario y, abajo, lo que dijo el backend."
      >
        <ErrorProbe
          title="Recurso que no existe"
          endpoint="GET /api/v1/membership/get/{id}"
          expected="404 (o 400 si el backend valida el formato del id)"
          run={() =>
            api.get('/api/v1/membership/get/{id}', {
              params: { id: '00000000-0000-4000-8000-000000000000' },
            })
          }
        />
        <ErrorProbe
          title="Endpoint protegido sin token"
          endpoint="GET /api/v1/users/all"
          expected="401"
          run={() => request('get', '/api/v1/users/all', { auth: false })}
        />
      </GallerySection>
    </main>
  );
}
