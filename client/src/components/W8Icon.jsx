/**
 * W8Icon — Icons8 watercolor icon loaded from CDN.
 * Browse IDs at: https://icons8.com/icons/all--style-water-color
 *
 * Usage:
 *   <W8Icon id="idja0q6oFAQN" size={24} alt="home" />
 *
 * Predefined keys (use <W8Icon name="home" />):
 */

const ICONS = {
  home:          'idja0q6oFAQN',
  utilities:     'vzhJNJm8xDLu',   // lightning bolt
  calendar:      'QKivoN3fCm7f',
  bookings:      'NMf0U3aRO2MV',   // box / package
  notifications: 'HdIjijJ4PNyz',   // bell / alarm
  profile:       'NJ1TH7krhhxS',   // male user
  users:         'dZt5aTCBGdvF',   // crowd
  organizations: 'mRKx2xZqKyFy',   // company building
  analytics:     'DvsgOYRjuwlr',   // combo chart
  audit:         'UTOf1sBsM6Tv',   // news / clipboard
  verification:  'dwhGzD9VAiZ3',   // padlock / verification
  folder:        'FYI6LfcQUyOR',   // opened folder
  search:        'OxDyKkYjQ5Yk',   // binoculars
  admin:         'aGnwPPVtbbQ7',   // administrator male
  settings:      'Rg9GBTEpoDts',
  check:         'mswvLW2p0NED',
  clock:         'nHY04GtENGyX',
  coins:         'AvmPijdPezYo',
  shield:        'j9U3SvBtTjaM',   // security pass
  flat:          'QpU1t4EQD0xS',   // folder (repurposed as home unit)
  phone:         'FetLlgyOVldq',   // event (repurposed)
  email:         'czpd3OfwK2l4',
  lock:          'dwhGzD9VAiZ3',
};

export { ICONS };

export default function W8Icon({ id, name, size = 24, alt = '', className = '', style }) {
  const iconId = id || ICONS[name];
  if (!iconId) return null;

  return (
    <img
      src={`https://img.icons8.com/?size=${Math.round(size * 2)}&id=${iconId}&format=png`}
      alt={alt || name || ''}
      width={size}
      height={size}
      className={`w8-icon ${className}`}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      draggable={false}
    />
  );
}
