import React from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const SupabaseStatus: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const hasConfig = supabaseUrl && supabaseAnonKey;
  
  if (hasConfig) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-xl max-w-2xl mx-4">
        <div className="flex items-start">
          <AlertCircle className="h-6 w-6 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Configuration Supabase Manquante
            </h3>
            <div className="mt-3 text-sm text-gray-700">
              <p>Pour utiliser l'authentification, vous devez :</p>
              <ol className="mt-2 list-decimal list-inside space-y-1">
                <li>Créer un projet sur <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline">supabase.com</a></li>
                <li>Créer un fichier <code className="bg-red-100 px-1 rounded">.env</code> avec :</li>
              </ol>
              <pre className="mt-3 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
{`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key`}
              </pre>
              <p className="mt-3">
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
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Mode démo :</strong> L'application fonctionne avec des données fictives en attendant la configuration Supabase.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseStatus;