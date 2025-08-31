/**
 * Shared application types
 */

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnhancePayload {
  id: string | number;
  title: string;
  description?: string | null;
  prompt: string;
}

export interface EnhanceNormalized {
  title: string;
  description: string | null;
}

export interface EnhanceResponseShape {
  title?: string;
  description?: string | null;
  enhancedTitle?: string;
  enhanced_description?: string | null;
  data?: { title?: string; description?: string | null };
  output?: { title?: string; description?: string | null };
}

export interface CredentialsErrors {
  username?: string;
  password?: string;
}

