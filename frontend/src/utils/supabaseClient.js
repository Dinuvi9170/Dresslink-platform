import {createClient} from '@supabase/supabase-js';

const supabaseUrl = 'https://hlomqmuddubgdahmgoxx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhsb21xbXVkZHViZ2RhaG1nb3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNzk3MTAsImV4cCI6MjA2MDk1NTcxMH0.vGuS6-hRQdJHyQNu3puufVJhEISwzjC1xJaNQ9dOoU8';
export const supabase = createClient(supabaseUrl,supabaseKey);
