import React from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

const SupabaseStatus: React.FC = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const hasConfig = supabaseUrl && supabaseAnonKey;
  
  // Toujours masquer pour éviter les problèmes
  return null

};

export default SupabaseStatus;