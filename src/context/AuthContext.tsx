import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, AuthUser, getUserProfile } from '../lib/supabase'

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
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          dispatch({ type: 'SET_LOADING', payload: false })
          return
        }

        if (session?.user) {
          const profile = await getUserProfile(session.user.id)
          dispatch({ 
            type: 'SET_USER', 
            payload: { user: profile, supabaseUser: session.user } 
          })
        } else {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      } catch (error) {
        console.error('Error in getSession:', error)
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    getSession()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await getUserProfile(session.user.id)
          dispatch({ 
            type: 'SET_USER', 
            payload: { user: profile, supabaseUser: session.user } 
          })
        } else if (event === 'SIGNED_OUT') {
          dispatch({ type: 'SIGN_OUT' })
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          const profile = await getUserProfile(session.user.id)
          dispatch({ 
            type: 'SET_USER', 
            payload: { user: profile, supabaseUser: session.user } 
          })
        } else {
          dispatch({ type: 'SET_LOADING', payload: false })
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        dispatch({ type: 'SET_LOADING', payload: false })
        return { success: false, error: error.message }
      }

      if (data.user) {
        const profile = await getUserProfile(data.user.id)
        if (!profile) {
          await supabase.auth.signOut()
          return { success: false, error: 'Profil employé non trouvé. Contactez votre administrateur.' }
        }
        
        dispatch({ 
          type: 'SET_USER', 
          payload: { user: profile, supabaseUser: data.user } 
        })
      }

      return { success: true }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false })
      return { success: false, error: 'Erreur de connexion' }
    }
  }

  const signUp = async (email: string, password: string, profileData: Partial<AuthUser>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: profileData.firstName,
            last_name: profileData.lastName
          }
        }
      })

      if (error) {
        dispatch({ type: 'SET_LOADING', payload: false })
        return { success: false, error: error.message }
      }

      if (data.user) {
        try {
          // Créer le profil employé
          await createEmployeeProfile(data.user.id, email, profileData)
        } catch (profileError) {
          console.error('Error creating profile:', profileError)
          // Ne pas bloquer l'inscription si la création du profil échoue
        }
        
        dispatch({ type: 'SET_LOADING', payload: false })
        return { success: true }
      }

      return { success: false, error: 'Erreur lors de la création du compte' }
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false })
      return { success: false, error: 'Erreur lors de l\'inscription' }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      dispatch({ type: 'SIGN_OUT' })
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

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
        .eq('auth_user_id', state.supabaseUser?.id)

      if (error) {
        return { success: false, error: error.message }
      }

      // Recharger le profil
      const updatedProfile = await getUserProfile(state.supabaseUser!.id)
      if (updatedProfile) {
        dispatch({ 
          type: 'SET_USER', 
          payload: { user: updatedProfile, supabaseUser: state.supabaseUser } 
        })
      }

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