export const BIN_PRESETS: Array<{ type: string; color: string; hex: string }> = [
  { type: 'General Waste', color: 'purple', hex: '#7e22ce' },
  { type: 'Recycling', color: 'blue', hex: '#2563eb' },
  { type: 'Paper & Card', color: 'blue', hex: '#1d4ed8' },
  { type: 'Glass', color: 'green', hex: '#16a34a' },
  { type: 'Garden Waste', color: 'green', hex: '#15803d' },
  { type: 'Food Waste', color: 'brown', hex: '#92400e' },
];

export function hexForColor(color: string): string {
  const preset = BIN_PRESETS.find((p) => p.color === color);
  if (preset) return preset.hex;
  switch (color) {
    case 'black':
      return '#1f2937';
    case 'blue':
      return '#2563eb';
    case 'green':
      return '#16a34a';
    case 'brown':
      return '#92400e';
    case 'red':
      return '#dc2626';
    case 'yellow':
      return '#ca8a04';
    case 'purple':
      return '#7e22ce';
    case 'gray':
    default:
      return '#6b7280';
  }
}

export const COLOR_CHOICES = [
  { label: 'Black', value: 'black' },
  { label: 'Blue', value: 'blue' },
  { label: 'Green', value: 'green' },
  { label: 'Brown', value: 'brown' },
  { label: 'Red', value: 'red' },
  { label: 'Yellow', value: 'yellow' },
  { label: 'Purple', value: 'purple' },
  { label: 'Gray', value: 'gray' },
];
