import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  fetchAdSettings,
  fetchAdStats,
  type AdSettings,
  type AdStatRow,
} from '../lib/repositories/ads';
import {
  alpha,
  COLORS,
  DOCK_CLEARANCE,
  FONTS,
  INK_WASH,
  RADIUS,
  SCREEN_PADDING,
  SHADOWS,
  TEXT,
} from '../theme';

interface MonetizationScreenProps {
  onBack: () => void;
}

/** Simulated earnings: impressions are paid per thousand (CPM), clicks one by one (CPC). */
export function estimateRevenue(
  impressions: number,
  clicks: number,
  settings: Pick<AdSettings, 'cpm_usd' | 'cpc_usd'>
): number {
  return (impressions / 1000) * Number(settings.cpm_usd) + clicks * Number(settings.cpc_usd);
}

const usd = (value: number) =>
  `US$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

const int = (value: number) => value.toLocaleString('es-AR');

const ctr = (impressions: number, clicks: number) =>
  impressions > 0 ? `${((clicks / impressions) * 100).toFixed(1).replace('.', ',')}%` : '—';

/**
 * "Panel de monetización (demo)": what the sponsored cards would have earned, from the real
 * impressions and clicks in `ad_events` and the simulated prices in `ad_settings`.
 */
export const MonetizationScreen: React.FC<MonetizationScreenProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<AdSettings | null>(null);
  const [rows, setRows] = useState<AdStatRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextSettings, nextRows] = await Promise.all([fetchAdSettings(), fetchAdStats()]);
      setSettings(nextSettings);
      setRows(nextRows);
      setError(null);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Error desconocido');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const totals = (rows ?? []).reduce(
    (sum, row) => ({
      impressions: sum.impressions + row.impressions,
      clicks: sum.clicks + row.clicks,
    }),
    { impressions: 0, clicks: 0 }
  );
  const revenue = settings ? estimateRevenue(totals.impressions, totals.clicks, settings) : 0;
  const loading = (rows === null || settings === null) && !error;

  return (
    <View style={styles.screen}>
      {/* Pinned header */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={6}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.ink} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Monetización</Text>
          <Text style={styles.subtitle}>Simulación con datos reales de uso</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.ink} />
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}
        >
          {error ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>No pudimos cargar el panel</Text>
              <Text style={styles.muted}>{error}</Text>
              <Pressable onPress={() => void refresh()} accessibilityRole="button">
                <Text style={styles.link}>Reintentar</Text>
              </Pressable>
            </View>
          ) : null}

          {settings ? (
            <>
              {/* Headline */}
              <View style={styles.hero}>
                <Text style={styles.heroLabel}>Ganancia estimada</Text>
                <Text style={styles.heroValue}>{usd(revenue)}</Text>
                <Text style={styles.heroFormula}>
                  {int(totals.impressions)} vistas × {usd(Number(settings.cpm_usd))} cada mil
                  {'  +  '}
                  {int(totals.clicks)} clics × {usd(Number(settings.cpc_usd))}
                </Text>
              </View>

              {/* KPIs */}
              <View style={styles.kpiRow}>
                <Kpi label="Vistas" value={int(totals.impressions)} />
                <Kpi label="Clics" value={int(totals.clicks)} />
                <Kpi label="CTR" value={ctr(totals.impressions, totals.clicks)} />
              </View>

              {/* Per business */}
              <Text style={styles.sectionLabel}>Por anunciante</Text>
              {rows && rows.length === 0 ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Todavía no hay datos</Text>
                  <Text style={styles.muted}>
                    Las vistas y los clics aparecen acá cuando alguien ve una tarjeta patrocinada
                    en el inicio.
                  </Text>
                </View>
              ) : (
                <View style={styles.list}>
                  {rows?.map((row) => (
                    <View key={row.placeId} style={styles.row}>
                      <View style={styles.rowText}>
                        <Text style={styles.rowName} numberOfLines={1}>
                          {row.placeName}
                        </Text>
                        <Text style={styles.rowMeta}>
                          {int(row.impressions)} vistas · {int(row.clicks)} clics · CTR{' '}
                          {ctr(row.impressions, row.clicks)} · {int(row.viewers)}{' '}
                          {row.viewers === 1 ? 'persona' : 'personas'}
                        </Text>
                      </View>
                      <Text style={styles.rowRevenue}>
                        {usd(estimateRevenue(row.impressions, row.clicks, settings))}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Current configuration */}
              <Text style={styles.sectionLabel}>Configuración actual</Text>
              <View style={styles.card}>
                <ConfigLine label="Estado" value={settings.enabled ? 'Activada' : 'Desactivada'} />
                <ConfigLine label="Frecuencia" value={`Cada ${settings.every_n_posts} posteos`} />
                <ConfigLine label="Búsqueda" value={`«${settings.search_query}»`} />
                <ConfigLine label="Etiqueta" value={settings.label} />
                <ConfigLine
                  label="Renovación"
                  value={`Cada ${settings.cache_ttl_hours} h por zona`}
                />
                <ConfigLine
                  label="Si falla la búsqueda"
                  value={settings.use_demo_fallback ? 'Negocios de ejemplo' : 'Sin publicidad'}
                />
                <Text style={styles.hint}>
                  Se cambia en Supabase, en la tabla ad_settings. La app lo toma al recargar.
                </Text>
              </View>
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
};

const Kpi: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.kpi}>
    <Text style={styles.kpiValue}>{value}</Text>
    <Text style={styles.kpiLabel}>{label}</Text>
  </View>
);

const ConfigLine: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.configLine}>
    <Text style={styles.configLabel}>{label}</Text>
    <Text style={styles.configValue} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  flex: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: COLORS.cream,
    borderBottomWidth: 1,
    borderBottomColor: INK_WASH.hairline,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.parchment,
    ...SHADOWS.soft,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...TEXT.headline,
  },
  subtitle: {
    ...TEXT.small,
    fontSize: 11,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 16,
    paddingBottom: DOCK_CLEARANCE,
    gap: 12,
  },
  hero: {
    padding: 20,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.dock,
    gap: 4,
    ...SHADOWS.darkGlow,
  },
  heroLabel: {
    ...TEXT.eyebrow,
    color: alpha(COLORS.parchment, 0.7),
  },
  heroValue: {
    fontFamily: FONTS.serif,
    fontSize: 36,
    lineHeight: 42,
    color: COLORS.butter,
  },
  heroFormula: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 16,
    color: alpha(COLORS.parchment, 0.75),
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpi: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.parchment,
    borderWidth: 1,
    borderColor: INK_WASH.hairline,
  },
  kpiValue: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    lineHeight: 28,
    color: COLORS.ink,
  },
  kpiLabel: {
    ...TEXT.eyebrow,
    fontSize: 9,
  },
  sectionLabel: {
    ...TEXT.eyebrow,
    marginTop: 8,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.parchment,
    borderWidth: 1,
    borderColor: INK_WASH.hairline,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.ink,
  },
  rowMeta: {
    ...TEXT.small,
    fontSize: 10,
  },
  rowRevenue: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink,
  },
  card: {
    padding: 16,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.parchment,
    gap: 8,
    ...SHADOWS.card,
  },
  cardTitle: {
    ...TEXT.subtitle,
  },
  muted: {
    ...TEXT.body,
  },
  link: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.fucsia,
  },
  configLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  configLabel: {
    ...TEXT.small,
  },
  configValue: {
    ...TEXT.small,
    flexShrink: 1,
    fontWeight: '700',
    color: COLORS.ink,
    textAlign: 'right',
  },
  hint: {
    ...TEXT.small,
    fontSize: 10,
    fontStyle: 'italic',
    color: INK_WASH.faint,
    marginTop: 4,
  },
});
