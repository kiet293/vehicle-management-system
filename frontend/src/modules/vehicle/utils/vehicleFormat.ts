export const formatPlate = (val: string): string => {
  const s = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (s.length > 3 && s.length <= 8) {
    const prefix = s.substring(0, 3);
    const rest = s.substring(3);
    if (rest.length <= 4) {
      return `${prefix}-${rest}`;
    }
    return `${prefix}-${rest.substring(0, 3)}.${rest.substring(3)}`;
  }
  return s;
};

export const formatKm = (km?: number | null): string =>
  km === undefined || km === null ? '—' : `${km.toLocaleString('vi-VN')} km`;

export const formatDateTime = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDuration = (minutes?: number | null): string => {
  if (minutes === undefined || minutes === null) return 'Đang chạy';
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} giờ` : `${hours}h ${rest}p`;
};

export const FALLBACK_VEHICLE_IMAGE =
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=60';

export const MAINTENANCE_INTERVAL_KM = 5000;