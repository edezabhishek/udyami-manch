import { ExternalLink, Github, Info } from 'lucide-react';
import React, { type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from '../../i18n';
import Section from './Section';
import { StatusPill } from './settingsKit';
import { fs } from '../shared/DialogShell';

interface Props {
  appVersion: string;
}

/** Tile chrome that reads the tile's colour from `--tile`: the border and a faint ring on hover. */
const TILE_HOVER = 'hover:border-[color:var(--tile)] hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--tile)_14%,transparent)]';
/** The icon square in the tile's colour. */
const TILE_ICON = 'bg-[color-mix(in_srgb,var(--tile)_12%,transparent)] text-[color:var(--tile)]';

/**
 * One outbound link as a tile: a tinted icon square, a title and a hint, the
 * external-link mark on the right. The border picks up the tile's colour while
 * the pointer is on it.
 */
function LinkTile({ href, color, icon, title, hint }: {
  href: string;
  /** A brand colour or a theme token, handed to the classes as `--tile`. */
  color?: string;
  icon?: ReactNode;
  title: ReactNode;
  hint: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex min-w-0 items-center gap-3 overflow-hidden rounded-[14px] border border-edge bg-surface-card px-3.5 py-3 no-underline shadow-sm transition-[border-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${color ? TILE_HOVER : ''}`}
      style={color ? ({ '--tile': color } as CSSProperties) : undefined}
    >
      {icon && (
        <span className={`grid h-10 w-10 flex-none place-items-center rounded-[12px] ${color ? TILE_ICON : 'bg-surface-tertiary text-content-secondary'}`}>
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-content" style={fs(13, 'body')}>{title}</div>
        <div className="truncate text-content-faint" style={fs(11.5)}>{hint}</div>
      </div>
      <ExternalLink size={14} className="flex-none text-content-faint" />
    </a>
  );
}

/** Where the Udyami Manch source lives. AGPL-3.0 §13: users over a network must be offered the source. Update when the public repo is created. */
const SOURCE_URL = 'https://github.com/liketrek/TREK';

export default function AboutTab({ appVersion }: Props): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Section title={t('settings.about')} icon={Info} badge={<StatusPill>v{appVersion}</StatusPill>}>
      <div className="flex flex-col gap-1.5">
        <p className="m-0 leading-relaxed text-content-secondary" style={fs(13, 'body')}>
          Udyami Manch helps people find businesses owned and run by Nepalis and Indians, anywhere in the world.
        </p>
        <p className="m-0 leading-relaxed text-content-faint" style={fs(12, 'body')}>
          Built on TREK, open-source software licensed under AGPL-3.0. This software is derived from the source code for TREK.
        </p>
      </div>
      <LinkTile
        href={SOURCE_URL}
        icon={<Github size={19} />}
        title={t('settings.about.sourceTitle')}
        hint={t('settings.about.sourceHint')}
      />
    </Section>
  );
}
