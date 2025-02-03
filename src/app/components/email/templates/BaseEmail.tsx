'use client'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
} from '@react-email/components'
import { EmailStyles } from './styles/EmailStyles'

interface BaseEmailProps {
  previewText: string
  title: string
  children: React.ReactNode
}

export function BaseEmail({ previewText, title, children }: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={EmailStyles.main}>
        <Container style={EmailStyles.container}>
          <Heading style={EmailStyles.h1}>{title}</Heading>
          {children}
        </Container>
      </Body>
    </Html>
  )
} 