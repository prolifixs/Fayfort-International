export const EmailStyles = {
  // Base styles
  main: {
    backgroundColor: '#f9fafb',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
  },
  container: {
    margin: '0 auto',
    padding: '0',
    width: '100%',
    maxWidth: '600px',
  },

  // Header styles
  header: {
    backgroundColor: '#2D3748',
    padding: '24px',
    textAlign: 'center' as const,
  },
  logo: {
    width: '150px',
    height: 'auto',
    margin: '0 auto',
  },
  brandName: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: '600',
    margin: '12px 0 0',
  },

  // Content styles
  content: {
    backgroundColor: '#ffffff',
    padding: '32px 24px',
    borderRadius: '8px',
    margin: '24px 0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  h1: {
    color: '#1a1a1a',
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '1.25',
    marginBottom: '24px',
    textAlign: 'left' as const,
  },
  text: {
    color: '#484848',
    fontSize: '16px',
    lineHeight: '24px',
    marginBottom: '16px',
  },

  // Button styles
  button: {
    primary: {
      backgroundColor: '#4f46e5',
      borderRadius: '6px',
      color: '#fff',
      fontSize: '16px',
      fontWeight: '500',
      textDecoration: 'none',
      textAlign: 'center' as const,
      display: 'inline-block',
      padding: '12px 24px',
      margin: '16px 0',
    },
    secondary: {
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '6px',
      color: '#374151',
      fontSize: '16px',
      fontWeight: '500',
      textDecoration: 'none',
      textAlign: 'center' as const,
      display: 'inline-block',
      padding: '12px 24px',
      margin: '16px 0',
    },
  },

  // Data display styles
  detailsContainer: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    margin: '24px 0',
    padding: '16px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #e5e7eb',
  },
  detailLabel: {
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: '500',
  },
  detailValue: {
    color: '#111827',
    fontSize: '14px',
    fontWeight: '600',
  },

  // Footer styles
  footer: {
    backgroundColor: '#2D3748',
    color: '#ffffff',
    padding: '24px',
    textAlign: 'center' as const,
    fontSize: '14px',
    lineHeight: '20px',
  },
  footerLinks: {
    margin: '16px 0',
  },
  footerLink: {
    color: '#ffffff',
    textDecoration: 'none',
    margin: '0 8px',
  },
  footerText: {
    color: '#9CA3AF',
    margin: '8px 0',
  },

  // Utility styles
  divider: {
    borderTop: '1px solid #e5e7eb',
    margin: '24px 0',
  },
  alert: {
    success: {
      backgroundColor: '#ecfdf5',
      border: '1px solid #10b981',
      color: '#065f46',
      padding: '16px',
      borderRadius: '6px',
      margin: '16px 0',
    },
    warning: {
      backgroundColor: '#fffbeb',
      border: '1px solid #f59e0b',
      color: '#92400e',
      padding: '16px',
      borderRadius: '6px',
      margin: '16px 0',
    },
    error: {
      backgroundColor: '#fef2f2',
      border: '1px solid #ef4444',
      color: '#991b1b',
      padding: '16px',
      borderRadius: '6px',
      margin: '16px 0',
    },
  },

  heading: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px',
  },
  itemText: {
    fontSize: '14px',
    margin: '0',
  },
  totalText: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#111827',
  },
  note: {
    fontSize: '14px',
    color: '#6B7280',
    fontStyle: 'italic',
  },
}; 