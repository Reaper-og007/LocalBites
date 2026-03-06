import { AppState } from 'react-native'
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hcpzkfgomroyfcmcqteh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjcHprZmdvbXJveWZjbWNxdGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwODA3OTgsImV4cCI6MjA4NjY1Njc5OH0.V5qRaJN1Yny_5ifuBkJ-O5sepD2ONnDKrlifDRYdW-I'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: null, // We aren't using Auth persistence for public data yet
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})