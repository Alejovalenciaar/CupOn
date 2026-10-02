interface ActiveDaysProps {
  days?: string[];
  className?: string;
}

const DAYS_MAP = [
  { key: 'MONDAY', label: 'L', full: 'Lunes' },
  { key: 'TUESDAY', label: 'M', full: 'Martes' },
  { key: 'WEDNESDAY', label: 'X', full: 'Miércoles' },
  { key: 'THURSDAY', label: 'J', full: 'Jueves' },
  { key: 'FRIDAY', label: 'V', full: 'Viernes' },
  { key: 'SATURDAY', label: 'S', full: 'Sábado' },
  { key: 'SUNDAY', label: 'D', full: 'Domingo' },
];

export default function ActiveDaysPills({ days, className = '' }: ActiveDaysProps) {
  // Si no se especifican días o viene vacío, por defecto de lunes a jueves como especifica el caso de uso
  const effectiveDays = days && days.length > 0 
    ? days 
    : ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {DAYS_MAP.map((day) => {
        const isActive = effectiveDays.includes(day.key);
        return (
          <span
            key={day.key}
            title={`${day.full}: ${isActive ? 'Activo' : 'No disponible'}`}
            className={`inline-flex items-center justify-center w-5 h-5 text-[11px] rounded transition-colors ${
              isActive
                ? 'bg-content-primary text-white font-medium'
                : 'opacity-30 line-through text-content-muted bg-surface-muted'
            }`}
          >
            {day.label}
          </span>
        );
      })}
    </div>
  );
}
