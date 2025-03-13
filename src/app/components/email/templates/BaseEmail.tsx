'use client'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Img,
  Link,
  Text,
} from '@react-email/components'
import { EmailStyles } from './styles/EmailStyles'

interface BaseEmailProps {
  previewText: string;
  title: string;
  children: React.ReactNode;
  branding?: {
    logo?: string;
    name?: string;
  };
  footer?: {
    text?: string;
    links?: Array<{ text: string; url: string }>;
    showPoweredBy?: boolean;
  };
}

export function BaseEmail({ 
  previewText, 
  title, 
  children, 
  branding = {
    name: 'Fayfort International',
    logo: `${process.env.NEXT_PUBLIC_APP_URL}/images/logo.png`
  },
  footer = {
    showPoweredBy: true,
    links: [
      { text: 'Terms', url: '/terms' },
      { text: 'Privacy', url: '/privacy' },
      { text: 'Contact Us', url: '/contact' }
    ]
  }
}: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={EmailStyles.main}>
        <Container style={EmailStyles.container}>
          {/* Header */}
          <Section style={EmailStyles.header}>
            {branding.logo && (
              <Img
                src={branding.logo}
                alt={branding.name}
                style={EmailStyles.logo}
              />
            )}
            {branding.name && (
              <Text style={EmailStyles.brandName}>
                {branding.name}
              </Text>
            )}
          </Section>

          {/* Content */}
          <Section style={EmailStyles.content}>
            <Heading style={EmailStyles.h1}>{title}</Heading>
            {children}
          </Section>

          {/* Footer */}
          <Section style={EmailStyles.footer}>
            {footer.links && (
              <div style={EmailStyles.footerLinks}>
                {footer.links.map((link, index) => (
                  <>
                    {index > 0 && ' • '}
                    <Link
                      key={link.url}
                      href={link.url}
                      style={EmailStyles.footerLink}
                    >
                      {link.text}
                    </Link>
                  </>
                ))}
              </div>
            )}
            
            {footer.text && (
              <Text style={EmailStyles.footerText}>
                {footer.text}
              </Text>
            )}
            
            {footer.showPoweredBy && (
              <Text style={EmailStyles.footerText}>
                Powered by WondaTechnologies
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  )
} 