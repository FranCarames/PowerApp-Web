import { useState } from 'react';
import { useNavigate } from 'react-router';

import { getErrorMessage } from '@/api/errors';
import type { User } from '@/api/types';
import { useMembershipTypes } from '@/features/account/hooks/useMembershipTypes';
import { useUserPayments } from '@/features/account/hooks/useUserPayments';
import { formatDate } from '@/shared/lib/dates';
import { formatPrice } from '@/shared/lib/format';
import { fullName } from '@/shared/lib/fullName';
import {
  latestPayment,
  membershipStatusOf,
} from '@/shared/lib/membershipStatus';
import {
  Button,
  Card,
  Columns,
  ErrorState,
  Field,
  Input,
  Note,
  Select,
  useToast,
} from '@/shared/ui';

import { useRegisterPayment } from '../hooks/useRegisterPayment';
import styles from './PaymentForm.module.css';

/** Una fecha `days` días después de hoy, como texto ("7 Nov 2026"). */
function dateIn(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date.toISOString());
}

/**
 * El tipo de membresía de un pago a un alumno (CU-E-29) y el botón. Va con `key` por el alumno: al
 * cambiarlo, el formulario arranca de nuevo. El tipo empieza en el de su último pago (si todavía se
 * ofrece), porque casi siempre se renueva el mismo.
 *
 * Solo se ofrecen los tipos activos: `GET /membership/all` trae también los dados de baja y el
 * backend no valida `active` al registrar el pago. El resumen es solo una vista previa: el
 * vencimiento lo calcula el backend, que cuenta desde el día del pago.
 */
export function PaymentForm({ student }: { student: User }) {
  const navigate = useNavigate();
  const toast = useToast();
  const register = useRegisterPayment();
  const types = useMembershipTypes();
  const payments = useUserPayments(student.id);
  const [picked, setPicked] = useState<string | null>(null);

  const options = (types.data ?? [])
    .filter(({ active }) => active)
    .sort((a, b) => a.duration - b.duration);
  const last = payments.data ? latestPayment(payments.data) : null;
  const status = membershipStatusOf(last);
  // Lo que se eligió; si no, el tipo del último pago, si todavía se ofrece.
  const typeId =
    picked ?? options.find(({ id }) => id === last?.membership_id)?.id ?? '';
  const type = options.find(({ id }) => id === typeId);

  function confirm() {
    if (!type || register.isPending) return;
    register.mutate(
      { user_id: student.id, membership_id: type.id },
      {
        onSuccess: () => {
          toast.success(`Pago registrado · ${fullName(student)}`);
          navigate('/c/membresias');
        },
      },
    );
  }

  // El error es de un intento con este alumno y este tipo: al elegir otro, ya no corresponde.
  const failed =
    register.isError && register.variables.membership_id === type?.id;

  if (types.isError) {
    return (
      <ErrorState
        title="No pudimos cargar los tipos de membresía"
        message={getErrorMessage(types.error)}
        onRetry={() => void types.refetch()}
        retrying={types.isRefetching}
      />
    );
  }

  return (
    <div>
      {last && (status === 'active' || status === 'expiring_soon') && (
        <Note tone="warn" icon="alert" className={styles.note}>
          Su membresía actual vence el {formatDate(last.expired_at)}. El pago
          nuevo cuenta desde hoy: no se suman los días que le quedan.
        </Note>
      )}
      {!student.active && (
        <Note tone="warn" icon="alert" className={styles.note}>
          La cuenta está inactiva. El pago se registra igual, pero no va a poder
          ingresar hasta que la reactives.
        </Note>
      )}
      {types.data && options.length === 0 && (
        <Note tone="warn" icon="alert" className={styles.note}>
          No hay tipos de membresía activos. El Admin los crea en Membresías.
        </Note>
      )}
      <Field label="Tipo de membresía">
        <Select
          value={typeId}
          disabled={options.length === 0}
          onChange={(event) => setPicked(event.target.value)}
        >
          <option value="" disabled>
            {types.isPending ? 'Cargando…' : 'Elegí un tipo de membresía'}
          </option>
          {options.map(({ id, name, duration }) => (
            <option key={id} value={id}>
              {name} · {duration} {duration === 1 ? 'día' : 'días'}
            </option>
          ))}
        </Select>
      </Field>
      <Columns>
        <Field label="Monto">
          <Input
            readOnly
            className={styles.readonly}
            value={type ? formatPrice(type.price) : '–'}
          />
        </Field>
        <Field label="Fecha de pago">
          <Input readOnly className={styles.readonly} value="Hoy" />
        </Field>
      </Columns>
      {type && (
        <Card className={styles.summary}>
          <div className={styles.line}>
            <span className={styles.muted}>Membresía</span>
            <b>{type.name}</b>
          </div>
          <div className={styles.line}>
            <span className={styles.muted}>Vigencia</span>
            <b>
              {dateIn(0)} → {dateIn(type.duration)}
            </b>
          </div>
          <div className={styles.divider} />
          <div className={styles.line}>
            <b>Total</b>
            <span className={styles.total}>{formatPrice(type.price)}</span>
          </div>
        </Card>
      )}
      {failed && (
        <Note tone="err" icon="alert" role="alert" className={styles.note}>
          {getErrorMessage(register.error, {
            400: 'Ese tipo de membresía ya no existe. Elegí otro.',
            404: 'El alumno ya no existe. Elegí a otro.',
          })}
        </Note>
      )}
      <Button disabled={!type} loading={register.isPending} onClick={confirm}>
        Confirmar pago
      </Button>
    </div>
  );
}
