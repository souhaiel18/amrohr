import React, { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { Users, Eye, EyeOff, AlertCircle } from 'lucide-react'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [message, setMessage] = useState('')
  
  // Champs pour l'inscription
  const [signUpData, setSignUpData] = useState({
    firstName: '',
    lastName: '',
    department: '',
    position: '',
    phone: ''
  })

  const { signIn, signUp, resetPassword, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname || '/'

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    const result = await signIn(email, password)
    if (!result.success) {
      setError(result.error || 'Erreur de connexion')
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    const result = await signUp(email, password, signUpData)
    if (result.success) {
      setMessage('Compte créé ! Vérifiez votre email pour confirmer votre inscription.')
      setIsSignUp(false)
    } else {
      setError(result.error || 'Erreur lors de l\'inscription')
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    const result = await resetPassword(email)
    if (result.success) {
      setMessage('Email de réinitialisation envoyé ! Vérifiez votre boîte mail.')
      setResetMode(false)
    } else {
      setError(result.error || 'Erreur lors de la réinitialisation')
    }
  }

  if (resetMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center">
              <div className="rounded-full bg-emerald-100 p-3">
                <Users className="h-12 w-12 text-emerald-600" />
              </div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Réinitialiser le mot de passe
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <Input
              label="Adresse email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="votre@email.com"
            />

            {error && (
              <div className="flex items-center text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}

            {message && (
              <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md">
                {message}
              </div>
            )}

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Envoi en cours...' : 'Envoyer le lien'}
              </Button>
              
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setResetMode(false)}
              >
                Retour à la connexion
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="rounded-full bg-emerald-100 p-3">
              <Users className="h-12 w-12 text-emerald-600" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Créer un compte' : 'Connexion au système RH'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignUp 
              ? 'Remplissez vos informations pour créer votre compte'
              : 'Connectez-vous avec vos identifiants'
            }
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={isSignUp ? handleSignUp : handleSignIn}>
          {isSignUp && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Prénom"
                  type="text"
                  value={signUpData.firstName}
                  onChange={(e) => setSignUpData({...signUpData, firstName: e.target.value})}
                  required
                  placeholder="Jean"
                />
                <Input
                  label="Nom"
                  type="text"
                  value={signUpData.lastName}
                  onChange={(e) => setSignUpData({...signUpData, lastName: e.target.value})}
                  required
                  placeholder="Dupont"
                />
              </div>
              <Input
                label="Département"
                type="text"
                value={signUpData.department}
                onChange={(e) => setSignUpData({...signUpData, department: e.target.value})}
                required
                placeholder="IT, RH, Marketing..."
              />
              <Input
                label="Poste"
                type="text"
                value={signUpData.position}
                onChange={(e) => setSignUpData({...signUpData, position: e.target.value})}
                required
                placeholder="Développeur, Manager..."
              />
              <Input
                label="Téléphone"
                type="tel"
                value={signUpData.phone}
                onChange={(e) => setSignUpData({...signUpData, phone: e.target.value})}
                placeholder="+33 1 23 45 67 89"
              />
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Adresse email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="votre@email.com"
            />
            
            <div className="relative">
              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={isSignUp ? 'Minimum 6 caractères' : 'Votre mot de passe'}
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          )}

          {message && (
            <div className="text-green-600 text-sm text-center bg-green-50 p-3 rounded-md">
              {message}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading 
              ? (isSignUp ? 'Création en cours...' : 'Connexion en cours...') 
              : (isSignUp ? 'Créer le compte' : 'Se connecter')
            }
          </Button>

          <div className="flex flex-col space-y-2">
            <button
              type="button"
              className="text-sm text-emerald-600 hover:text-emerald-500 text-center"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
                setMessage('')
              }}
            >
              {isSignUp 
                ? 'Déjà un compte ? Se connecter' 
                : 'Pas de compte ? S\'inscrire'
              }
            </button>
            
            {!isSignUp && (
              <button
                type="button"
                className="text-sm text-gray-600 hover:text-gray-500 text-center"
                onClick={() => setResetMode(true)}
              >
                Mot de passe oublié ?
              </button>
            )}
          </div>
        </form>

        {!isSignUp && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Mode Démo :</h4>
            <div className="text-xs text-blue-800 space-y-1">
              <div>Créez un compte ou utilisez les identifiants de test</div>
              <div><strong>Email :</strong> demo@company.com</div>
              <div><strong>Mot de passe :</strong> demo123</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login