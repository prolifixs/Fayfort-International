export interface TeamMember {
  id: number
  name: string
  role: string
  image: string
  bio: string
  linkedin?: string
  twitter?: string
  github?: string
}

export interface TeamMemberCardProps {
  member: TeamMember
  index: number
} 