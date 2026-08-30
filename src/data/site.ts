export const site = {
  name: 'Take 3 Agency',
  email: 'hello@take3agency.com',
  phone: '020 8088 2833',
  phoneHref: '+442080882833',
  instagram: 'https://www.instagram.com/take3agency/',
  ctaLabel: 'GET IN TOUCH',
  /** Where the timecode slate is clocked. First entry is the default. */
  city: 'LONDON',
  timeZone: 'Europe/London',
};

/** Clicking the slate cycles through these, in order. */
export const slateCities = [
  { label: 'LONDON', timeZone: 'Europe/London' },
  { label: 'LOS ANGELES', timeZone: 'America/Los_Angeles' },
  { label: 'NEW YORK', timeZone: 'America/New_York' },
] as const;

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
    menu deliberately — it is a search landing page linked from /spacts.

    Two tiers on purpose. Artists lists the disciplines with a standing
    roster; Specialists lists the divisions clients arrive searching for by
    name ("stunt double", "circus artist London", "intimacy coordinator"),
    each with its own page so the search lands on the subject rather than on a
    mention of it. /specialists stays the hub above them and keeps the
    catch-all promise for briefs with no page of their own. */
export const navLinks: NavItem[] = [
  { label: 'Home', href: '/' },
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
  {
    label: 'Specialists',
    href: '/specialists',
    children: [
      { label: 'Stunt Performers & Doubles', href: '/stunt-performers' },
      { label: 'Circus & Physical', href: '/circus-artists' },
      { label: 'Unique Talent', href: '/unique-talent' },
      { label: 'Intimacy', href: '/intimacy' },
    ],
  },
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
