import Mapbox from '@rnmapbox/maps';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { InfoCard } from '../components/InfoCard';
import { Screen } from '../components/Screen';
import { StatusBanner } from '../components/StatusBanner';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { FarmProfile } from '../types';
import { colors } from '../utils/theme';

type Coordinate = [number, number];

const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
const defaultCenter: Coordinate = [73.0479, 31.5204];
const defaultBoundary: Coordinate[] = [
  [73.0419, 31.5174],
  [73.0539, 31.5174],
  [73.0539, 31.5234],
  [73.0419, 31.5234],
];
const kanalPerHectare = 19.7684;

if (mapboxToken) {
  Mapbox.setAccessToken(mapboxToken);
}

export function MapScreen() {
  const { user } = useAuth();
  const { error: farmError, farmProfile, updateProfile } = useFarm();
  const profilePoints = useMemo(() => profileBoundaryPoints(farmProfile?.boundaryGeoJson), [farmProfile?.boundaryGeoJson]);
  const [points, setPoints] = useState<Coordinate[]>(() => profilePoints ?? defaultBoundary);
  const [center, setCenter] = useState<Coordinate>(() => centerFor(profilePoints ?? defaultBoundary, farmProfile));
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const boundary = useMemo(() => toBoundary(points), [points]);
  const areaHectares = useMemo(() => polygonAreaHectares(points), [points]);
  const areaKanal = areaHectares * kanalPerHectare;

  useEffect(() => {
    if (dirty) return;
    const nextPoints = profilePoints ?? defaultBoundary;
    setPoints(nextPoints);
    setCenter(centerFor(nextPoints, farmProfile));
  }, [dirty, farmProfile, profilePoints]);

  function addPoint(coordinate: Coordinate) {
    if (saving) return;
    setDirty(true);
    setError(null);
    setPoints((current) => [...current, coordinate]);
    setCenter(coordinate);
  }

  async function saveMapProfile() {
    if (!user) return;
    setSaving(true);
    setError(null);
    const nextProfile: FarmProfile = {
      userId: user.userId,
      farmSize: farmProfile?.farmSize ?? `${areaKanal.toFixed(1)} kanal`,
      cropTypes: farmProfile?.cropTypes?.length ? farmProfile.cropTypes : ['wheat'],
      soilType: farmProfile?.soilType ?? 'loam',
      irrigationType: farmProfile?.irrigationType ?? 'canal + tube well',
      location: farmProfile?.location ?? 'Punjab, Pakistan',
      centerLng: center[0],
      centerLat: center[1],
      boundaryGeoJson: boundary,
      areaHectares,
      areaKanal,
    };
    try {
      await updateProfile(nextProfile);
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch {
      setError('Could not save farm map. Check the backend connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  function undoPoint() {
    setDirty(true);
    setError(null);
    setPoints((current) => {
      const next = current.slice(0, -1);
      setCenter(centerFor(next, farmProfile));
      return next;
    });
  }

  function resetBoundary() {
    setDirty(true);
    setError(null);
    setPoints(defaultBoundary);
    setCenter(centerFor(defaultBoundary, null));
  }

  if (!mapboxToken) {
    return (
      <Screen>
        <Text style={styles.title}>Farm map</Text>
        <StatusBanner tone="warning" icon="map" text="Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN and build with EAS to enable Mapbox farm mapping." />
        <InfoCard title="Mapping is production-only" subtitle="Mapbox requires native code and does not run inside Expo Go." icon="map" />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Farm map</Text>
        <Text style={styles.subtitle}>Tap field corners to trace the farm boundary. Save when the area looks correct.</Text>
      </View>
      {farmError ? <StatusBanner tone="warning" icon="alert-circle" text={farmError} /> : null}
      {error ? <StatusBanner tone="danger" icon="alert-circle" text={error} /> : null}
      {saved ? <StatusBanner tone="success" icon="checkmark-circle" text="Farm map saved to profile." /> : null}
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{points.length}</Text>
          <Text style={styles.metricLabel}>points</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{areaKanal.toFixed(1)}</Text>
          <Text style={styles.metricLabel}>kanal</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{areaHectares.toFixed(2)}</Text>
          <Text style={styles.metricLabel}>hectares</Text>
        </View>
      </View>
      <View style={styles.mapWrap}>
        <Mapbox.MapView
          style={styles.map}
          onPress={(feature) => {
            const coordinate = feature.geometry?.coordinates as Coordinate | undefined;
            if (coordinate) addPoint(coordinate);
          }}
        >
          <Mapbox.Camera centerCoordinate={center} zoomLevel={14} />
          <Mapbox.ShapeSource id="farm-boundary" shape={boundary}>
            <Mapbox.FillLayer id="farm-boundary-fill" style={{ fillColor: colors.leaf, fillOpacity: 0.22 }} />
            <Mapbox.LineLayer id="farm-boundary-line" style={{ lineColor: colors.leafDark, lineWidth: 2 }} />
          </Mapbox.ShapeSource>
          <Mapbox.ShapeSource id="farm-points" shape={toPoints(points)}>
            <Mapbox.CircleLayer id="farm-points-circle" style={{ circleColor: colors.wheat, circleStrokeColor: colors.leafDark, circleStrokeWidth: 2, circleRadius: 6 }} />
          </Mapbox.ShapeSource>
        </Mapbox.MapView>
      </View>
      <View style={styles.actions}>
        <Button label="Undo" icon="arrow-undo" variant="secondary" onPress={undoPoint} disabled={saving || points.length <= 3} style={styles.action} />
        <Button label="Reset" icon="refresh" variant="secondary" onPress={resetBoundary} disabled={saving} style={styles.action} />
        <Button label={saving ? 'Saving' : 'Save'} icon="save" onPress={saveMapProfile} disabled={saving || points.length < 3} style={styles.action} />
      </View>
    </Screen>
  );
}

function toBoundary(points: Coordinate[]) {
  const ring = points.length ? [...points, points[0]] : [];
  return {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Polygon' as const,
          coordinates: [ring],
        },
      },
    ],
  };
}

function toPoints(points: Coordinate[]) {
  return {
    type: 'FeatureCollection' as const,
    features: points.map((point, index) => ({
      type: 'Feature' as const,
      properties: { index },
      geometry: {
        type: 'Point' as const,
        coordinates: point,
      },
    })),
  };
}

function profileBoundaryPoints(boundaryGeoJson: unknown): Coordinate[] | null {
  const maybe = boundaryGeoJson as { features?: Array<{ geometry?: { coordinates?: Coordinate[][] } }> } | undefined;
  const ring = maybe?.features?.[0]?.geometry?.coordinates?.[0];
  if (!ring || ring.length < 4) return null;
  return ring.slice(0, -1);
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function centerFor(points: Coordinate[], farmProfile: FarmProfile | null | undefined): Coordinate {
  if (farmProfile?.centerLng != null && farmProfile?.centerLat != null) {
    return [farmProfile.centerLng, farmProfile.centerLat];
  }
  return [average(points.map((point) => point[0])), average(points.map((point) => point[1]))];
}

function polygonAreaHectares(points: Coordinate[]) {
  if (points.length < 3) return 0;
  const meanLat = average(points.map((point) => point[1]));
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng = 111_320 * Math.cos((meanLat * Math.PI) / 180);
  const projected = points.map(([lng, lat]) => [lng * metersPerDegreeLng, lat * metersPerDegreeLat]);
  const areaMeters = Math.abs(
    projected.reduce((sum, point, index) => {
      const next = projected[(index + 1) % projected.length];
      return sum + point[0] * next[1] - next[0] * point[1];
    }, 0) / 2,
  );
  return areaMeters / 10_000;
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  metrics: {
    flexDirection: 'row',
    gap: 8,
  },
  metric: {
    flex: 1,
    minHeight: 58,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 8,
    justifyContent: 'center',
  },
  metricValue: {
    color: colors.leafDark,
    fontSize: 18,
    fontWeight: '900',
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  mapWrap: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
  },
  map: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  action: {
    flex: 1,
  },
});
