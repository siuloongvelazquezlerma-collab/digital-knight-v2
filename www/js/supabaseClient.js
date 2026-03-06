import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const supabase = createClient(
  'https://wplyrhcszuoordgaphax.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwbHlyaGNzenVvb3JkZ2FwaGF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNDg5NzAsImV4cCI6MjA4MTgyNDk3MH0.VctFmTaBMHkhbqDhezAvFoAT_QcC-bk7A3gH1MoMScU'
);
