/**
 * Authentication Utilities — Google OAuth + Password
 */

import { supabase } from "./supabase/client";

// ─── Admin Emails ───────────────────────────────────────────────

const ADMIN_EMAILS: string[] = [
  "admin@campusflow.com",
  "varunaroransr@gmail.com",
  "imiitian.46@gmail.com",
];

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

// ─── Google OAuth ───────────────────────────────────────────────

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) throw new Error(error.message);
  return data;
}

// ─── Email + Password Sign In ───────────────────────────────────

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);
  return data;
}

// ─── Email + Password Sign Up ───────────────────────────────────

export async function signUp(email: string, password: string, name?: string, branch?: string, year?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        branch: branch || "",
        year: year || "",
      },
    },
  });

  if (error) throw new Error(error.message);

  // Supabase returns a user with identities=[] if the email already exists
  // (this is their way of preventing user enumeration)
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    throw new Error("An account with this email already exists. Please sign in instead.");
  }

  return data;
}

// ─── Sign Out ───────────────────────────────────────────────────

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

// ─── Get Current Session ────────────────────────────────────────

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
}

// ─── Get Current User ───────────────────────────────────────────

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

// ─── Password Reset ─────────────────────────────────────────────

export async function resetPassword(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function updatePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw new Error(error.message);
  return data;
}

// ─── Unused OTP functions removed — keeping for compat ──────────
export async function sendSignUpOTP(email: string) { return signUp(email, "", ""); }
export async function verifyOTP(_email: string, _token: string) { return null; }
export async function setPassword(password: string) { return updatePassword(password); }
export async function sendResetOTP(email: string) { return resetPassword(email); }
