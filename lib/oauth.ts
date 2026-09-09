import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// --- Apple Sign-In (iOS only) ---
// Requires: Apple Developer account with "Sign in with Apple" capability enabled
// for the app's bundle identifier, AND the Apple provider enabled in
// Supabase Dashboard > Authentication > Providers > Apple.
export async function signInWithApple() {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL, AppleAuthentication.AppleAuthenticationScope.FULL_NAME],
    nonce: hashedNonce,
  });

  if (!credential.identityToken) {
    throw new Error('Kein Identity Token von Apple erhalten.');
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });

  if (error) throw error;
}

// --- Google Sign-In ---
// Requires: OAuth Client IDs from console.cloud.google.com (Web, iOS, Android),
// entered in app.json under extra.googleWebClientId / googleIosClientId / googleAndroidClientId,
// AND the Google provider enabled in Supabase Dashboard > Authentication > Providers > Google
// (using the Web client ID + secret there).
export function useGoogleAuth() {
  const extra = Constants.expoConfig?.extra ?? {};

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: extra.googleWebClientId,
    iosClientId: extra.googleIosClientId,
    androidClientId: extra.googleAndroidClientId,
  });

  async function handleResponse() {
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken;
      if (!idToken) return;
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (error) throw error;
    }
  }

  return { request, response, promptAsync, handleResponse };
}
