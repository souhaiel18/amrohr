// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yavdxdiyycfqlgijlzqs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhdmR4ZGl5eWNmcWxnaWpsenFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTYyNzgsImV4cCI6MjA2ODY5MjI3OH0.EynYf5oCuA587Iu2cBGEgqJ8jRXvjDaa3D0WF65wRDA';
export const supabase = createClient(supabaseUrl, supabaseKey);

