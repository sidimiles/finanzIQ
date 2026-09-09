import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Switch, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/theme';
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
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
      <Text style={[styles.header, { color: colors.text }]}>Profil</Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Angemeldet als</Text>
        <Text style={[styles.email, { color: colors.text }]}>{email}</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
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

      <TouchableOpacity style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/(modals)/categories')}>
        <Ionicons name="pricetags-outline" size={20} color={colors.text} />
        <Text style={[styles.actionText, { color: colors.text }]}>Kategorien verwalten</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleBackupExport} disabled={exportingBackup}>
        <Ionicons name="download-outline" size={20} color={colors.text} />
        <Text style={[styles.actionText, { color: colors.text }]}>{exportingBackup ? 'Exportiere...' : 'Daten-Backup exportieren'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleResetPassword}>
        <Ionicons name="key-outline" size={20} color={colors.text} />
        <Text style={[styles.actionText, { color: colors.text }]}>Passwort zurücksetzen</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionRow, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color={colors.text} />
        <Text style={[styles.actionText, { color: colors.text }]}>Abmelden</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.actionRow, styles.dangerRow]} onPress={handleDeleteAccount}>
        <Ionicons name="trash-outline" size={20} color={colors.expense} />
        <Text style={[styles.actionText, { color: colors.expense }]}>Konto löschen</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  card: { borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1 },
  label: { fontSize: 13, marginBottom: 4 },
  email: { fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  rowBorder: { borderTopWidth: 1, marginTop: 8, paddingTop: 16 },
  rowLabel: { fontSize: 16 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  dangerRow: { backgroundColor: 'rgba(255,107,107,0.08)', borderColor: 'rgba(255,107,107,0.3)' },
  actionText: { fontSize: 16, fontWeight: '600' },
});
