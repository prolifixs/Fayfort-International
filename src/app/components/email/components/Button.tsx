import { Button as EmailButton } from '@react-email/components';
import { EmailStyles } from '../templates/styles/EmailStyles';

interface ButtonProps {
  href: string;
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export function Button({ 
  href, 
  variant = 'primary', 
  children 
}: ButtonProps) {
  return (
    <EmailButton
      href={href}
      style={EmailStyles.button[variant]}
    >
      {children}
    </EmailButton>
  );
} 