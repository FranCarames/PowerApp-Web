import { Link } from 'react-router';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { ROLE_AVATAR_TONE } from '@/features/auth/roles';
import { fullName } from '@/shared/lib/fullName';
import { Avatar } from '@/shared/ui';

import styles from './AccountLink.module.css';

/** Tu avatar en la barra superior de las pantallas de inicio: lleva a Mi cuenta. */
export function AccountLink() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Link to="/cuenta" aria-label="Mi cuenta" className={styles.link}>
      <Avatar
        name={fullName(user)}
        src={user.profile_picture}
        tone={ROLE_AVATAR_TONE[user.role]}
      />
    </Link>
  );
}
