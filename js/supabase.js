// ============================================
// supabase.js — Configuración del cliente
// ============================================
// Reemplaza estos valores con tus credenciales reales de Supabase.
// Los encuentras en: https://app.supabase.com → Settings → API

const SUPABASE_URL = 'https://uxvazuknwikvynqqudel.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4dmF6dWtud2lrdnlucXF1ZGVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMTU2ODUsImV4cCI6MjA4Nzg5MTY4NX0._-orIH397XQIDx6B_fPxo-gqghwfhH4-u0Z5U1K8G2s';

// El CDN expone la librería como window.supabase (un objeto con createClient).
// Usamos una variable distinta para el cliente instanciado.
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
