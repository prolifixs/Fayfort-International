import { Text } from '@react-email/components';
import { EmailStyles } from '../templates/styles/EmailStyles';

interface DetailRowProps {
  label: string;
  value: string | number | React.ReactNode;
}

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div style={EmailStyles.detailRow}>
      <Text style={EmailStyles.detailLabel}>{label}</Text>
      <Text style={EmailStyles.detailValue}>{value}</Text>
    </div>
  );
} 