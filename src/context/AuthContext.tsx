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
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          const profile = await getUserProfile(session.user.id)
          if (profile) {
            dispatch({ 
              type: 'SET_USER', 
              payload: { user: profile, supabaseUser: session.user } 
            })
          } else {
            dispatch({ type: 'SET_LOADING', payload: false })
          }
        } else {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    initializeAuth()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await getUserProfile(session.user.id)
        if (profile) {
          dispatch({ 
            type: 'SET_USER', 
            payload: { user: profile, supabaseUser: session.user } 
          })
        }
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'SIGN_OUT' })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        const profile = await getUserProfile(data.user.id)
        if (profile) {
          dispatch({ 
            type: 'SET_USER', 
            payload: { user: profile, supabaseUser: data.user } 
          })
          return { success: true }
        } else {
          return { success: false, error: 'Profil employé non trouvé' }
        }
      }

      return { success: false, error: 'Erreur de connexion' }
    } catch (error) {
      return { success: false, error: 'Erreur de connexion' }
    }
  }

  const signUp = async (email: string, password: string, profileData: Partial<AuthUser>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        // Créer le profil employé
        await createEmployeeProfile(data.user.id, email, profileData)
        return { success: true }
      }

      return { success: false, error: 'Erreur lors de l\'inscription' }
    } catch (error) {
      return { success: false, error: 'Erreur lors de l\'inscription' }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    dispatch({ type: 'SIGN_OUT' })
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Erreur lors de la réinitialisation' }
    }
  }

  const updateProfile = async (updates: Partial<AuthUser>) => {
    try {
      if (!state.user) return { success: false, error: 'Utilisateur non connecté' }
      
      const { error } = await supabase
        .from('employees')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          phone: updates.phone,
          department: updates.department,
          position: updates.position
        })
        .eq('id', state.user.id)

      if (error) {
        return { success: false, error: error.message }
      }

      // Mettre à jour l'état local
      const updatedUser = { ...state.user, ...updates }
      dispatch({ 
        type: 'SET_USER', 
        payload: { user: updatedUser, supabaseUser: state.supabaseUser } 
      })

      return { success: true }
    } catch (error) {
      return { success: false, error: 'Erreur lors de la mise à jour' }
    }
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