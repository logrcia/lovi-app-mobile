import { supabase } from '../db/client';

export interface SignUpResult {
  /** True when the project still requires email confirmation, so there is no session yet. */
  needsEmailConfirmation: boolean;
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) throw new Error(error.message);
}

export async function signUpWithPassword(
  email: string,
  password: string,
  name: string
): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      // handle_new_user() reads this to name the profile it creates.
      data: { name: name.trim() },
    },
  });

  if (error) throw new Error(error.message);

  return { needsEmailConfirmation: !data.session };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
