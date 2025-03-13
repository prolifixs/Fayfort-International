import { Text } from '@react-email/components';
import { EmailStyles } from '../templates/styles/EmailStyles';

interface AlertProps {
  type: 'success' | 'warning' | 'error';
  children: React.ReactNode;
}

export function Alert({ type, children }: AlertProps) {
  return (
    <div style={EmailStyles.alert[type]}>
      <Text style={{ margin: 0 }}>{children}</Text>
    </div>
  );
} 