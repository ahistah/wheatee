import Mapbox from '@rnmapbox/maps';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { StatusBanner } from '../components/StatusBanner';
import { useAuth } from '../context/AuthContext';
import { useFarm } from '../context/FarmContext';
import { FarmProfile } from '../types';
import { colors } from '../utils/theme';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
const DEFAULT_CENTER: [number, number] = [73.0479, 30.1575];
const KANAL_PER_HECTARE = 19.7684;

if (MAPBOX_TOKEN) {
  Mapbox.setAccessToken(MAPBOX_TOKEN);
}

type Position = [number, number];

function ringFromProfile(profile: FarmProfile | null): Position[] {
  const geometry = (profile?.boundaryGeoJson as any)?.features?.[0]?.geometry;
  const ring = geometry?.type === 'Polygon' ? geometry.coordinates?.[0] : null;
  if (!Array.isArray(ring)) return [];
  return ring.slice(0, -1).filter((point: unknown): point is Position => (
    Array.isArray(point)
    && typeof point[0] === 'number'
    && typeof point[1] === 'number'
  ));
}

function polygonFeature(points: Position[]) {
  if (points.length < 3) return null;
  const ring = [...points, points[0]];
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [ring],
        },
      },
    ],
  };
}

function lineFeature(points: Position[]) {
  if (points.length < 2) return null;
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: points.length > 2 ? [...points, points[0]] : points,
        },
      },
    ],
  };
}

function areaHectares(points: Position[]) {
  if (points.length < 3) return 0;
  const radius = 6378137;
  let area = 0;

  for (let index = 0; index < points.length; index += 1) {
    const [lng1, lat1] = points[index];
    const [lng2, lat2] = points[(index + 1) % points.length];
    area += (lng2 - lng1) * Math.PI / 180 * (
      2 + Math.sin(lat1 * Math.PI / 180) + Math.sin(lat2 * Math.PI / 180)
    );
  }

  return Math.abs((area * radius * radius) / 2) / 10000;
}

function centerOf(points: Position[]): Position {
  if (!points.length) return DEFAULT_CENTER;
  const sums = points.reduce(
    (total, point) => [total[0] + point[0], total[1] + point[1]] as Position,
    [0, 0],
  );
  return [sums[0] / points.length, sums[1] / points.length];
}

export function MapScreen() {
  const { user } = useAuth();
  const { farmProfile, updateProfile } = useFarm();
  const [points, setPoints] = useState<Position[]>([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setPoints(ringFromProfile(farmProfile));
  }, [farmProfile]);

  const polygon = useMemo(() => polygonFeature(points), [points]);
  const line = useMemo(() => lineFeature(points), [points]);
  const center = useMemo(() => centerOf(points), [points]);
  const hectares = useMemo(() => areaHectares(points), [points]);
  const kanal = hectares * KANAL_PER_HECTARE;

  function addPoint(event: any) {
    const coordinate = event?.geometry?.coordinates;
    if (!Array.isArray(coordinate) || typeof coordinate[0] !== 'number' || typeof coordinate[1] !== 'number') {
      return;
    }
    setNotice(null);
    setPoints((current) => [...current, [coordinate[0], coordinate[1]]]);
  }

  async function saveBoundary() {
    if (!user || !farmProfile || !polygon || points.length < 3) return;

    setSaving(true);
    setNotice(null);
    try {
      await updateProfile({
        ...farmProfile,
        boundaryGeoJson: polygon,
        centerLng: center[0],
        centerLat: center[1],
        areaHectares: hectares,
        areaKanal: kanal,
      });
      setNotice('Farm boundary saved to the profile.');
    } catch {
      setNotice('Farm boundary could not be saved. Check backend connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  if (!MAPBOX_TOKEN) {
    return (
      <Screen>
        <Text style={styles.title}>Farm map</Text>
        <StatusBanner
          tone="danger"
          icon="alert-circle"
          text="Mapbox token is missing. Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN before building the app."
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Farm map</Text>
        <Text style={styles.subtitle}>Tap field corners to map the boundary, then save it to the farm profile for planning advice.</Text>
      </View>

      {notice ? <StatusBanner tone={notice.includes('saved') ? 'success' : 'warning'} icon="map" text={notice} /> : null}

      <View style={styles.mapFrame}>
        <Mapbox.MapView style={styles.map} scaleBarEnabled={false} onPress={addPoint}>
          <Mapbox.Camera centerCoordinate={center} zoomLevel={points.length ? 14 : 6} animationMode="flyTo" animationDuration={500} />
          {polygon ? (
            <Mapbox.ShapeSource id="farm-boundary-fill" shape={polygon as any}>
              <Mapbox.FillLayer
                id="farm-boundary-fill-layer"
                style={{
                  fillColor: colors.leaf,
                  fillOpacity: 0.24,
                }}
              />
            </Mapbox.ShapeSource>
          ) : null}
          {line ? (
            <Mapbox.ShapeSource id="farm-boundary-line" shape={line as any}>
              <Mapbox.LineLayer
                id="farm-boundary-line-layer"
                style={{
                  lineColor: colors.leafDark,
                  lineWidth: 3,
                }}
              />
            </Mapbox.ShapeSource>
          ) : null}
        </Mapbox.MapView>
      </View>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{points.length}</Text>
          <Text style={styles.metricLabel}>corners</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{hectares ? hectares.toFixed(2) : '0.00'}</Text>
          <Text style={styles.metricLabel}>hectares</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{kanal ? kanal.toFixed(1) : '0.0'}</Text>
          <Text style={styles.metricLabel}>kanal</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button label="Undo" icon="arrow-undo" variant="secondary" onPress={() => setPoints((current) => current.slice(0, -1))} disabled={!points.length || saving} style={styles.action} />
        <Button label="Reset" icon="refresh" variant="secondary" onPress={() => setPoints([])} disabled={!points.length || saving} style={styles.action} />
      </View>
      {saving ? (
        <ActivityIndicator color={colors.leafDark} />
      ) : (
        <Button label="Save boundary" icon="save" onPress={saveBoundary} disabled={!farmProfile || points.length < 3} />
      )}
      {!farmProfile ? <StatusBanner tone="warning" icon="information-circle" text="Create a farm profile before saving a map boundary." /> : null}
    </Screen>
  );
}

export default MapScreen;

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  mapFrame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.field,
  },
  map: {
    flex: 1,
  },
  metrics: {
    flexDirection: 'row',
    gap: 8,
  },
  metric: {
    flex: 1,
    minHeight: 68,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    padding: 10,
    justifyContent: 'center',
  },
  metricValue: {
    color: colors.leafDark,
    fontSize: 19,
    fontWeight: '900',
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  action: {
    flex: 1,
  },
});
