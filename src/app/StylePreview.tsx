import { useState } from 'react';

import styles from './StylePreview.module.css';

// Página de prueba de T02: muestra las tipografías y los colores del prototipo
// para compararlos a ojo. La reemplaza /dev/ui (T03).

const FONT_FAMILIES = [
  {
    name: 'Barlow Condensed',
    token: '--fD',
    use: 'Títulos',
    weights: [600, 700, 800],
    sample: 'Mis alumnos',
    size: 36,
  },
  {
    name: 'Inter',
    token: '--fB',
    use: 'Cuerpo',
    weights: [400, 500, 600, 700, 800],
    sample: 'Press de banca plano · 3×8 con 80 kg',
    size: 14,
  },
  {
    name: 'JetBrains Mono',
    token: '--fM',
    use: 'Datos numéricos',
    weights: [500, 700, 800],
    sample: '100,5 kg · 0123456789',
    size: 22,
  },
];

const COLOR_GROUPS = [
  {
    title: 'Fondos y bordes',
    tokens: ['--base', '--card', '--el', '--border', '--border2'],
  },
  { title: 'Marca', tokens: ['--pri', '--priL', '--acc'] },
  { title: 'Texto', tokens: ['--tp', '--ts', '--tm'] },
  { title: 'Estados', tokens: ['--ok', '--warn', '--err'] },
  {
    title: 'Estados suaves',
    tokens: ['--okS', '--warnS', '--errS', '--priS', '--accS'],
  },
];

function readToken(token: string) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(token)
    .trim();
}

function Swatch({ token }: { token: string }) {
  // El valor se lee del CSS real: así esta página no duplica los tokens.
  const [value] = useState(() => readToken(token));

  return (
    <div className={styles.swatch}>
      <div className={styles.chip} style={{ background: `var(${token})` }} />
      <code className={styles.name}>{token}</code>
      <span className={styles.value}>{value}</span>
    </div>
  );
}

export function StylePreview() {
  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>T02 · Estilos globales</p>
      <h1 className={styles.title}>Tipografías y colores</h1>
      <p className={styles.intro}>
        Página de prueba para comparar con el prototipo. Los valores que se
        muestran salen de los tokens reales.
      </p>

      <section className={styles.section} aria-labelledby="tipografias">
        <h2 id="tipografias" className={styles.heading}>
          Tipografías
        </h2>
        <div className={styles.stack}>
          {FONT_FAMILIES.map(({ name, token, use, weights, sample, size }) => (
            <article key={token} className={styles.card}>
              <header className={styles.cardHeader}>
                <strong>{name}</strong>
                <code className={styles.token}>{token}</code>
                <span className={styles.use}>{use}</span>
              </header>
              {weights.map((weight) => (
                <div key={weight} className={styles.sampleRow}>
                  <span className={styles.sampleLabel}>{weight}</span>
                  <span
                    style={{
                      fontFamily: `var(${token})`,
                      fontWeight: weight,
                      fontSize: size,
                    }}
                  >
                    {sample}
                  </span>
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="colores">
        <h2 id="colores" className={styles.heading}>
          Colores
        </h2>
        <div className={styles.stack}>
          {COLOR_GROUPS.map(({ title, tokens }) => (
            <article key={title} className={styles.card}>
              <header className={styles.cardHeader}>
                <strong>{title}</strong>
              </header>
              <div className={styles.swatches}>
                {tokens.map((token) => (
                  <Swatch key={token} token={token} />
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="foco">
        <h2 id="foco" className={styles.heading}>
          Foco visible
        </h2>
        <div className={styles.card}>
          <p className={styles.intro}>
            Navegá con la tecla Tab: el anillo violeta (--acc) aparece solo con
            el teclado, no al hacer clic.
          </p>
          <div className={styles.focusRow}>
            <button type="button" className={styles.demoButton}>
              Botón de prueba
            </button>
            <a href="#foco" className={styles.demoLink}>
              Enlace de prueba
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
