import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, AuthUser, getUserProfile, createEmployeeProfile } from '../lib/supabase'

interface AuthState {
  user: AuthUser | null
  supabaseUser: SupabaseUser | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, profileData: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ success: boolean; error?: string }>
}

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: AuthUser | null; supabaseUser: SupabaseUser | null } }
  | { type: 'SIGN_OUT' }

const initialState: AuthState = {
  user: null,
  supabaseUser: null,
  isAuthenticated: false,
  isLoading: true
}

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        supabaseUser: action.payload.supabaseUser,
        isAuthenticated: !!action.payload.user,
        isLoading: false
      }
    case 'SIGN_OUT':
      return {
        ...state,
        user: null,
        supabaseUser: null,
        isAuthenticated: false,
        isLoading: false
      }
    default:
      return state
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    // Récupérer la session actuelle
    const getSession = async () => {
      dispatch({ type: 'SET_LOADING', payload: false })
      return
    }

    getSession()
  }, [])

  const signIn = async (email: string, password: string) => {
    // Mode démo - connexion simulée
    const mockUsers = {
      'admin@test.com': { id: '1', firstName: 'Admin', lastName: 'User', role: 'admin' as const },
      'hr@test.com': { id: '2', firstName: 'HR', lastName: 'Manager', role: 'hr' as const },
      'employee@test.com': { id: '3', firstName: 'Employee', lastName: 'User', role: 'employee' as const }
    }
    
    const mockUser = mockUsers[email as keyof typeof mockUsers]
    if (mockUser && password.length > 0) {
      const user: AuthUser = {
        ...mockUser,
        email,
        department: 'IT',
        position: 'Developer',
        phone: '+1234567890',
        startDate: '2024-01-01',
        status: 'active'
      }
      dispatch({ type: 'SET_USER', payload: { user, supabaseUser: null } })
      return { success: true }
    }
    
    return { success: false, error: 'Identifiants invalides' }
  }

  const signUp = async (email: string, password: string, profileData: Partial<AuthUser>) => {
    // Mode démo - inscription simulée
    return { success: true }
  }

  const signOut = async () => {
    dispatch({ type: 'SIGN_OUT' })
  }

  const resetPassword = async (email: string) => {
    return { success: true }
  }

  const updateProfile = async (updates: Partial<AuthUser>) => {
    return { success: true }
  }

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}