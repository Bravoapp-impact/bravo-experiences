import { supabase } from "@/integrations/supabase/client";

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: "m" | "f" | "x";
  accessCode?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AccessCodeValidation {
  entity_type: string;
  entity_id: string;
  entity_name: string;
  assigned_role: string;
}

function isAlreadyRegisteredError(error: unknown): boolean {
  const e = error as { code?: string; status?: number; message?: string } | null;
  if (!e) return false;
  if (e.code === "user_already_exists") return true;
  const msg = e.message || "";
  return /already.*registered/i.test(msg) || /already.*exists/i.test(msg);
}

export async function validateAccessCode(accessCode: string): Promise<AccessCodeValidation | null> {
  const { data, error } = await supabase
    .rpc('validate_access_code', { p_code: accessCode });

  if (error) throw error;
  
  // RPC returns an array, get the first result or null
  return data && data.length > 0 ? data[0] : null;
}

export async function incrementAccessCodeUsage(accessCode: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('increment_access_code_usage', { p_code: accessCode });

  if (error) throw error;
  return data === true;
}

export async function signUp({ email, password, firstName, lastName, gender, accessCode }: SignUpData) {
  // Domain-based signup path: no access code provided.
  // Do NOT pass company_id/role from the client — the server-side
  // handle_new_user trigger resolves the company from the email domain.
  if (!accessCode) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          first_name: firstName,
          last_name: lastName,
          gender,
        },
      },
    });

    if (error) {
      if (isAlreadyRegisteredError(error)) {
        throw new Error("EMAIL_ALREADY_REGISTERED");
      }
      throw error;
    }
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      throw new Error("EMAIL_ALREADY_REGISTERED");
    }
    return data;
  }

  // Access-code signup path
  const codeInfo = await validateAccessCode(accessCode);

  if (!codeInfo) {
    throw new Error("Codice di accesso non valido o scaduto");
  }

  // Build user metadata based on entity type
  const userMetadata: Record<string, unknown> = {
    first_name: firstName,
    last_name: lastName,
    gender,
    role: codeInfo.assigned_role,
  };

  if (codeInfo.entity_type === 'company') {
    userMetadata.company_id = codeInfo.entity_id;
  } else if (codeInfo.entity_type === 'association') {
    userMetadata.association_id = codeInfo.entity_id;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
      data: userMetadata,
    },
  });

  if (error) {
    if (isAlreadyRegisteredError(error)) {
      throw new Error("EMAIL_ALREADY_REGISTERED");
    }
    throw error;
  }

  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    throw new Error("EMAIL_ALREADY_REGISTERED");
  }

  // Increment usage counter
  await incrementAccessCodeUsage(accessCode);

  return {
    ...data,
    entityName: codeInfo.entity_name,
    entityType: codeInfo.entity_type,
    role: codeInfo.assigned_role,
  };
}

export async function signIn({ email, password }: SignInData) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*, companies(*), associations(*)")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return data;
}
