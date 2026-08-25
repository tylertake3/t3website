export const site = {
  name: 'Take 3 Agency',
  email: 'hello@take3agency.com',
  phone: '020 8088 2833',
  phoneHref: '+442080882833',
  instagram: 'https://www.instagram.com/take3agency/',
  ctaLabel: 'GET IN TOUCH',
  /** Where the timecode slate is clocked. */
  city: 'LONDON',
  timeZone: 'Europe/London',
};

/** The single "get in touch" link used by every call to action on the site. */
export const contactHref = `mailto:${site.email}`;

export interface NavItem {
  label: string;
  href: string;
  /** Shown as an indented sub-list in the overlay. URLs stay flat. */
  children?: { label: string; href: string }[];
}

/** Client-facing navigation. Menu hierarchy and URL structure are independent:
    categories keep their top-level paths. /what-is-a-spact stays out of the
    menu deliberately — it is a search landing page linked from /spacts. */
export const navLinks: NavItem[] = [
  {
    label: 'Artists',
    href: '/artists',
    children: [
      { label: 'SPACTs', href: '/spacts' },
      { label: 'Dancers', href: '/dancers' },
      { label: 'Models', href: '/models' },
      { label: 'Stand-ins & Picture Doubles', href: '/stand-ins' },
    ],
  },
  { label: 'Specialists', href: '/specialists' },
  { label: 'Laural', href: '/laural' },
  { label: 'Who We Are', href: '/about' },
  { label: 'Credits', href: '/credits' },
  { label: 'Contact', href: '/contact' },
];

/** The one page that speaks to performers rather than clients. */
export const performerLink = {
  label: 'Join the roster',
  href: '/join',
  note: 'Open to dancers, SPACTs, models and specialist performers with professional experience.',
};
