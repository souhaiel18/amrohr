import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔗 Connexion à Supabase...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseAnonKey ? 'Configurée' : 'Manquante')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables Supabase manquantes!')
  console.log('Vérifiez votre fichier .env')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  }
})

// Types pour l'authentification
export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'hr' | 'employee'
  department: string
  position: string
  phone: string
  avatar?: string
  startDate: string
  status: 'active' | 'inactive'
}

// Fonction pour obtenir le profil utilisateur complet
export const getUserProfile = async (userId: string): Promise<AuthUser | null> => {
  try {
    console.log('🔍 Recherche du profil pour:', userId)
    
    // Timeout pour éviter les blocages
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), 10000)
    })
    
    const queryPromise = supabase
      .from('employees')
      .select('*')
      .eq('auth_user_id', userId)
      .maybeSingle()
    
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    if (!data) {
      console.log('❌ Aucun profil employé trouvé pour:', userId)
      console.log('💡 Vérifiez que auth_user_id est bien rempli dans la table employees')
      return null
    }

    console.log('✅ Profil trouvé:', data.first_name, data.last_name)
    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      role: data.role,
      department: data.department,
      position: data.position,
      phone: data.phone,
      avatar: data.avatar,
      startDate: data.start_date,
      status: data.status
    }
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    return null
  }
}

// Fonction pour créer un profil employé après inscription
export const createEmployeeProfile = async (
  userId: string, 
  email: string, 
  profileData: Partial<AuthUser>
) => {
  try {
    // Générer un ID employé unique
    const employeeId = `EMP${String(Date.now()).slice(-6)}`
    
    const { data, error } = await supabase
      .from('employees')
      .insert({
        auth_user_id: userId,
        email,
        first_name: profileData.firstName || '',
        last_name: profileData.lastName || '',
        role: profileData.role || 'employee',
        department: profileData.department || '',
        position: profileData.position || '',
        phone: profileData.phone || '',
        start_date: profileData.startDate || new Date().toISOString().split('T')[0],
        birth_date: new Date().toISOString().split('T')[0],
        address: '',
        status: 'active',
        employee_id: employeeId
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating employee profile:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error in createEmployeeProfile:', error)
    throw error
  }
}