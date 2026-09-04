/* Whether a client logo cell actually has artwork behind it.

   A cell whose file is missing renders as an empty plate rather than firing a
   404 for a picture that isn't there.

   Checked against the project root as well as this module's own location: once
   Astro bundles the site this file no longer sits in src/lib, so a path built
   from import.meta.url points at the build output and every logo reads as
   missing. Both roots are tried so the check also holds in dev. */
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export type ClientCell = { dark?: string; light?: string; height?: number };

export const hasLogo = (cell: ClientCell) => {
  if (!cell.dark) return false;
  const candidates = [
    resolve(process.cwd(), 'public' + cell.dark),
    fileURLToPath(new URL('../../public' + cell.dark, import.meta.url)),
  ];
  return candidates.some((candidate) => existsSync(candidate));
};
