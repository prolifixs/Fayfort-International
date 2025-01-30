import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User, Session } from '@supabase/supabase-js';

export class AuthService {
  private supabase = createClientComponentClient();
  private currentSession: Session | null = null;

  async initialize() {
    const { data: { session } } = await this.supabase.auth.getSession();
    this.currentSession = session;

    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentSession = session;
      this.handleAuthStateChange(event, session);
    });
  }

  private handleAuthStateChange(event: string, session: Session | null) {
    switch (event) {
      case 'SIGNED_IN':
        this.setupUserSession(session?.user);
        break;
      case 'SIGNED_OUT':
        this.clearUserSession();
        break;
      case 'TOKEN_REFRESHED':
        this.refreshUserSession(session);
        break;
    }
  }

  private setupUserSession(user: User | undefined) {
    if (user) {
      localStorage.setItem('user_role', user.user_metadata.role);
      this.setupAuthenticatedState();
    }
  }

  private clearUserSession() {
    localStorage.removeItem('user_role');
    this.clearAuthenticatedState();
  }

  private refreshUserSession(session: Session | null) {
    if (session) {
      this.currentSession = session;
    }
  }

  async checkPermission(requiredRole: string): Promise<boolean> {
    const userRole = localStorage.getItem('user_role');
    return this.hasRequiredRole(userRole, requiredRole);
  }

  private hasRequiredRole(userRole: string | null, requiredRole: string): boolean {
    const roleHierarchy = ['user', 'admin', 'superadmin'];
    if (!userRole) return false;
    
    const userRoleIndex = roleHierarchy.indexOf(userRole);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);
    
    return userRoleIndex >= requiredRoleIndex;
  }

  private async setupAuthenticatedState(): Promise<void> {
    const { data: { session } } = await this.supabase.auth.getSession();
    this.currentSession = session;
  }

  private clearAuthenticatedState(): void {
    // Clear authenticated state
    this.currentSession = null;
  }
} 