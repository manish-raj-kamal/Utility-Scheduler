const icons = [
  {
    label: 'Gym',
    emoji: '🏋️',
    style: { top: '8%', left: '6%', animationDelay: '0s', animationDuration: '6s' }
  },
  {
    label: 'Playground',
    emoji: '🛝',
    style: { top: '18%', right: '8%', animationDelay: '1s', animationDuration: '7s' }
  },
  {
    label: 'Sports',
    emoji: '🏸',
    style: { bottom: '22%', left: '4%', animationDelay: '2s', animationDuration: '5.5s' }
  },
  {
    label: 'EV Charging',
    emoji: '🔌',
    style: { top: '45%', right: '5%', animationDelay: '0.5s', animationDuration: '6.5s' }
  },
  {
    label: 'Generator',
    emoji: '⚡',
    style: { bottom: '10%', right: '12%', animationDelay: '1.5s', animationDuration: '5s' }
  },
  {
    label: 'Community Hall',
    emoji: '🏛️',
    style: { bottom: '8%', left: '10%', animationDelay: '2.5s', animationDuration: '7.5s' }
  },
  {
    label: 'Parking',
    emoji: '🅿️',
    style: { top: '6%', left: '45%', animationDelay: '3s', animationDuration: '6.2s' }
  },
  {
    label: 'Water',
    emoji: '💧',
    style: { top: '60%', left: '8%', animationDelay: '0.8s', animationDuration: '5.8s' }
  }
];

export default function FloatingIcons() {
  return (
    <div className="floating-icons" aria-hidden="true">
      {icons.map((icon) => (
        <div key={icon.label} className="floating-icon" style={icon.style} title={icon.label}>
          <span>{icon.emoji}</span>
        </div>
      ))}
    </div>
  );
}
