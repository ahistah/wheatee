import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { FarmProfile } from '../types';
import { colors } from '../utils/theme';

export function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { farmProfile, updateProfile } = useFarm();
  const [farmSize, setFarmSize] = useState('10 kanal');
  const [cropTypes, setCropTypes] = useState('wheat');
  const [soilType, setSoilType] = useState('loam');
  const [irrigationType, setIrrigationType] = useState('canal + tube well');
  const [location, setLocation] = useState('Punjab, Pakistan');
  const [saved, setSaved] = useState(false);

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
    const profile: FarmProfile = {
      userId: user.userId,
      farmSize,
      cropTypes: cropTypes.split(',').map((item) => item.trim()).filter(Boolean),
      soilType,
      irrigationType,
      location,
    };
    await updateProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <Screen>
      <Text style={styles.title}>Farm profile</Text>
      <Text style={styles.subtitle}>This context is sent with yield and planning questions.</Text>
      <View style={styles.form}>
        <TextInput value={farmSize} onChangeText={setFarmSize} placeholder="Farm size" style={styles.input} />
        <TextInput value={cropTypes} onChangeText={setCropTypes} placeholder="Crop types" style={styles.input} />
        <TextInput value={soilType} onChangeText={setSoilType} placeholder="Soil type" style={styles.input} />
        <TextInput value={irrigationType} onChangeText={setIrrigationType} placeholder="Irrigation type" style={styles.input} />
        <TextInput value={location} onChangeText={setLocation} placeholder="Location" style={styles.input} />
      </View>
      <Button label={saved ? 'Saved' : 'Save profile'} icon="save" onPress={save} />
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
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 16,
  },
});
