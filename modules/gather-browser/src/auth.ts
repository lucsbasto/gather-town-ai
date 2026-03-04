/**
 * Auth Module - Supabase Authentication
 * Handles user authentication with email/password, magic links, and OAuth
 */

import { createClient, SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email?: string;
  userMetadata?: Record<string, unknown>;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  client: SupabaseClient;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export type AuthCallback = (state: AuthState) => void;

// Configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

// Auth service class
export class AuthService {
  private client: SupabaseClient;
  private state: AuthState;
  private listeners: Set<AuthCallback> = new Set();
  private initialized = false;

  constructor() {
    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce' // More secure flow for web apps
      }
    });

    this.state = {
      user: null,
      session: null,
      client: this.client,
      isAuthenticated: false,
      isLoading: true
    };
  }

  // Initialize auth and check for existing session
  async init(): Promise<AuthState> {
    if (this.initialized) return this.state;

    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
      }

      if (session) {
        this.state = {
          user: session.user,
          session,
          client: this.client,
          isAuthenticated: true,
          isLoading: false
        };
      } else {
        // Try anonymous sign in for development
        await this.signInAnonymously();
      }

      // Listen for auth changes
      this.client.auth.onAuthStateChange((event, session) => {
        this.state = {
          user: session?.user || null,
          session,
          client: this.client,
          isAuthenticated: !!session,
          isLoading: false
        };
        this.notifyListeners();
      });

      this.initialized = true;
    } catch (err) {
      console.error('Auth initialization failed:', err);
      this.state.isLoading = false;
    }

    this.notifyListeners();
    return this.state;
  }

  // Get current auth state
  getState(): AuthState {
    return this.state;
  }

  // Subscribe to auth state changes
  subscribe(callback: AuthCallback): () => void {
    this.listeners.add(callback);
    // Immediately call with current state
    callback(this.state);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => cb(this.state));
  }

  // Sign up with email and password
  async signUp(email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          // Custom user metadata
          created_at: new Date().toISOString()
        }
      }
    });

    if (error) {
      return { user: null, error };
    }

    return { user: data.user, error: null };
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { user: null, error };
    }

    return { user: data.user, error: null };
  }

  // Sign in with magic link
  async signInWithMagicLink(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await this.client.auth.signInWithOtp({
      email,
      options: {
        redirectTo: window.location.origin
      }
    });

    return { error };
  }

  // Sign in with OAuth provider (Google, GitHub, Discord)
  async signInWithOAuth(provider: 'github' | 'google' | 'discord'): Promise<{ error: AuthError | null }> {
    const { error } = await this.client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
        scopes: provider === 'google' ? 'email profile' : undefined
      }
    });

    return { error };
  }

  // Sign in anonymously (for development/guest users)
  async signInAnonymously(): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.client.auth.signInAnonymous();
      
      if (error) {
        console.log('Anonymous auth not available:', error.message);
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (err) {
      console.log('Anonymous auth not available');
      return { user: null, error: null };
    }
  }

  // Sign out
  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await this.client.auth.signOut();
    return { error };
  }

  // Reset password
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    const { error } = await this.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    return { error };
  }

  // Update password (after reset)
  async updatePassword(newPassword: string): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await this.client.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return { user: null, error };
    }

    return { user: data.user, error: null };
  }

  // Get JWT token for API auth
  async getToken(): Promise<string | null> {
    const { data: { session } } = await this.client.auth.getSession();
    return session?.access_token || null;
  }

  // Verify token is valid
  async verifyToken(token: string): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await this.client.auth.getUser(token);
    return { user: data.user, error };
  }
}

// Export singleton instance
export const authService = new AuthService();

// React hook for auth (can be used with React)
export function useAuth() {
  return authService.getState();
}
