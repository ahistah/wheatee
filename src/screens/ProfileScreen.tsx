import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { Screen } from '../components/Screen';
import { StatusBanner } from '../components/StatusBanner';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { deleteAccountData } from '../services/api';
import { FarmProfile } from '../types';
import { colors } from '../utils/theme';

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { clearProfile, error: farmError, farmProfile, updateProfile } = useFarm();
  const [farmSize, setFarmSize] = useState('10 kanal');
  const [cropTypes, setCropTypes] = useState('wheat');
  const [soilType, setSoilType] = useState('loam');
  const [irrigationType, setIrrigationType] = useState('canal + tube well');
  const [location, setLocation] = useState('Punjab, Pakistan');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!farmProfile) return;
    setFarmSize(farmProfile.farmSize);
    setCropTypes(farmProfile.cropTypes.join(', '));
    setSoilType(farmProfile.soilType);
    setIrrigationType(farmProfile.irrigationType);
    setLocation(farmProfile.location);
  }, [farmProfile]);

  async function save() {
    if (!user) return;
    if (!farmSize.trim() || !cropTypes.trim()) {
      setError('Farm size and crop type are required for contextual advice.');
      return;
    }

    const profile: FarmProfile = {
      ...farmProfile,
      userId: user.userId,
      farmSize: farmSize.trim(),
      cropTypes: cropTypes.split(',').map((item) => item.trim()).filter(Boolean),
      soilType: soilType.trim(),
      irrigationType: irrigationType.trim(),
      location: location.trim(),
    };
    setSaving(true);
    setError(null);
    try {
      await updateProfile(profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch {
      setError('Could not save profile. Check the backend connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  function confirmDeleteData() {
    if (!user) return;
    Alert.alert(
      'Delete farm data?',
      'This removes your farm profile, mapped boundary, diagnosis history, and saved advice from Wheaty. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: deleteData,
        },
      ],
    );
  }

  async function deleteData() {
    if (!user) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteAccountData(user.userId);
      clearProfile();
      await signOut();
    } catch {
      setError('Could not delete account data. Check the backend connection and try again.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Farm profile</Text>
      <Text style={styles.subtitle}>This context is sent with yield and planning questions.</Text>
      {farmError ? <StatusBanner tone="warning" icon="alert-circle" text={farmError} /> : null}
      {error ? <StatusBanner tone="danger" icon="alert-circle" text={error} /> : null}
      {saved ? <StatusBanner tone="success" icon="checkmark-circle" text="Farm profile saved and ready for contextual advice." /> : null}
      {farmProfile?.areaKanal ? (
        <StatusBanner
          tone="info"
          icon="map"
          text={`Mapped boundary: ${farmProfile.areaKanal.toFixed(1)} kanal / ${farmProfile.areaHectares?.toFixed(2) ?? '0.00'} ha`}
        />
      ) : null}
      <View style={styles.form}>
        <Field label="Farm size" value={farmSize} onChangeText={setFarmSize} placeholder="10 kanal" />
        <Field label="Crop types" value={cropTypes} onChangeText={setCropTypes} placeholder="wheat, maize" />
        <Field label="Soil type" value={soilType} onChangeText={setSoilType} placeholder="loam" />
        <Field label="Irrigation type" value={irrigationType} onChangeText={setIrrigationType} placeholder="canal + tube well" />
        <Field label="Location" value={location} onChangeText={setLocation} placeholder="Punjab, Pakistan" />
      </View>
      <Button label={saving ? 'Saving' : 'Save profile'} icon="save" onPress={save} disabled={saving} />
      <Button
        label={deleting ? 'Deleting data' : 'Delete farm data'}
        icon="trash"
        variant="danger"
        onPress={confirmDeleteData}
        disabled={deleting || saving}
      />
      <Button label="Sign out" icon="log-out" variant="danger" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 10,
  },
});
