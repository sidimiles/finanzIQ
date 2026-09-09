import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Switch, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { supabase } from '../../lib/supabase';
import { useTheme, cardShadow, radius, spacing } from '../../lib/theme';
import { exportFullBackupJSON } from '../../lib/export';

const BIOMETRIC_KEY = 'finanziq_biometric_enabled';

export default function Profile() {
  const { colors, mode, toggle } = useTheme();
  const [email, setEmail] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [exportingBackup, setExportingBackup] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''));
    AsyncStorage.getItem(BIOMETRIC_KEY).then((val) => setBiometricEnabled(val === 'true'));
    LocalAuthentication.hasHardwareAsync().then(setBiometricAvailable);
  }, []);

  async function toggleBiometric(value: boolean) {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Bestätigen um biometrische Sperre zu aktivieren',
      });
      if (!result.success) return;
    }
    setBiometricEnabled(value);
    await AsyncStorage.setItem(BIOMETRIC_KEY, value ? 'true' : 'false');
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  async function handleResetPassword() {
    if (!email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      Alert.alert('Fehler', error.message);
    } else {
      Alert.alert('E-Mail gesendet', 'Prüfe dein Postfach für den Link zum Passwort zurücksetzen.');
    }
  }

  async function handleBackupExport() {
    setExportingBackup(true);
    try {
      await exportFullBackupJSON();
    } catch (e: any) {
      Alert.alert('Fehler beim Export', e.message);
    } finally {
      setExportingBackup(false);
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Vor dem Löschen',
      'Möchtest du zuerst ein Backup deiner Daten exportieren? Das Löschen ist danach endgültig.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Ohne Backup fortfahren', style: 'destructive', onPress: confirmFinalDelete },
        { text: 'Erst Backup exportieren', onPress: async () => { await handleBackupExport(); confirmFinalDelete(); } },
      ]
    );
  }

  function confirmFinalDelete() {
    Alert.alert(
      'Konto endgültig löschen?',
      'Das löscht dein Konto und ALLE Daten (Konten, Buchungen, Budgets) unwiderruflich.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Endgültig löschen',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.functions.invoke('delete-account');
            if (error) {
              Alert.alert('Fehler', 'Konto konnte nicht gelöscht werden. Versuch es erneut.');
              return;
            }
            await supabase.auth.signOut();
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ padding: spacing.md, paddingTop: 56 }}>
      <Text style={[styles.header, { color: colors.text }]}>Profil</Text>

      <View style={[styles.card, cardShadow, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="person" size={20} color={colors.accent} />
          </View>
          <View>
            <Text style={[styles.label, { color: colors.textMuted }]}>Angemeldet als</Text>
            <Text style={[styles.email, { color: colors.text }]}>{email}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.card, cardShadow, { backgroundColor: colors.card, shadowColor: colors.shadow }]}>
        <View style={styles.row}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Dunkles Design</Text>
          <Switch value={mode === 'dark'} onValueChange={toggle} trackColor={{ true: colors.accent }} />
        </View>

        {biometricAvailable && (
          <View style={[styles.row, styles.rowBorder, { borderTopColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Biometrische Sperre</Text>
            <Switch value={biometricEnabled} onValueChange={toggleBiometric} trackColor={{ true: colors.accent }} />
          </View>
        )}
      </View>

      <TouchableOpacity style={[styles.actionRow, cardShadow, { backgroundColor: colors.card, shadowColor: colors.shadow }]} onPress={() => router.push('/(modals)/categories')}>
        <View style={[styles.actionIcon, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name="pricetags-outline" size={18} color={colors.accent} />
        </View>
        <Text style={[styles.actionText, { color: colors.text }]}>Kategorien verwalten</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionRow, cardShadow, { backgroundColor: colors.card, shadowColor: colors.shadow }]} onPress={handleBackupExport} disabled={exportingBackup}>
        <View style={[styles.actionIcon, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name="download-outline" size={18} color={colors.accent} />
        </View>
        <Text style={[styles.actionText, { color: colors.text }]}>{exportingBackup ? 'Exportiere...' : 'Daten-Backup exportieren'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionRow, cardShadow, { backgroundColor: colors.card, shadowColor: colors.shadow }]} onPress={handleResetPassword}>
        <View style={[styles.actionIcon, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name="key-outline" size={18} color={colors.accent} />
        </View>
        <Text style={[styles.actionText, { color: colors.text }]}>Passwort zurücksetzen</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionRow, cardShadow, { backgroundColor: colors.card, shadowColor: colors.shadow }]} onPress={handleSignOut}>
        <View style={[styles.actionIcon, { backgroundColor: colors.accentSoft }]}>
          <Ionicons name="log-out-outline" size={18} color={colors.accent} />
        </View>
        <Text style={[styles.actionText, { color: colors.text }]}>Abmelden</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionRow, styles.dangerRow]} onPress={handleDeleteAccount}>
        <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,107,107,0.14)' }]}>
          <Ionicons name="trash-outline" size={18} color={colors.expense} />
        </View>
        <Text style={[styles.actionText, { color: colors.expense }]}>Konto löschen</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4, marginBottom: 20 },
  card: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, marginBottom: 2 },
  email: { fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  rowBorder: { borderTopWidth: 1, marginTop: 8, paddingTop: 16 },
  rowLabel: { fontSize: 16 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: 10,
  },
  actionIcon: { width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  dangerRow: { backgroundColor: 'rgba(255,107,107,0.08)' },
  actionText: { flex: 1, fontSize: 16, fontWeight: '600' },
});
