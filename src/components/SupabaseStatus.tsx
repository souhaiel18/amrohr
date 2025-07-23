import React from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const SupabaseStatus: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const hasConfig = supabaseUrl && supabaseAnonKey;
  
  if (hasConfig) {
    return null; // Ne rien afficher si tout est configuré
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <XCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Configuration Supabase Manquante
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Pour utiliser l'authentification, vous devez :</p>
              <ol className="mt-2 list-decimal list-inside space-y-1">
                <li>Créer un projet sur <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
                <li>Créer un fichier <code className="bg-red-100 px-1 rounded">.env</code> avec :</li>
              </ol>
              <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key`}
              </pre>
              <p className="mt-2">
                <strong>Status :</strong>
              </p>
              <ul className="mt-1 space-y-1">
                <li className="flex items-center">
                  {supabaseUrl ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  VITE_SUPABASE_URL
                </li>
                <li className="flex items-center">
                  {supabaseAnonKey ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  VITE_SUPABASE_ANON_KEY
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseStatus;