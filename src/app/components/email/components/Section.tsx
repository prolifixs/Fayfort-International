import { Section as EmailSection } from '@react-email/components';
import { EmailStyles } from '../templates/styles/EmailStyles';

interface SectionProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Section({ children, style }: SectionProps) {
  return (
    <EmailSection style={{ ...EmailStyles.content, ...style }}>
      {children}
    </EmailSection>
  );
} 