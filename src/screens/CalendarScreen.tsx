import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

import { Sticker } from '../components/Sticker';
import {
  alpha,
  CARD_SURFACE,
  COLORS,
  DOCK_CLEARANCE,
  FONTS,
  INK_WASH,
  RADIUS,
  SCREEN_PADDING,
} from '../theme';
import type { CalendarEvent, Pet } from '../types';

interface CalendarScreenProps {
  pet: Pet;
  events: CalendarEvent[];
}

type MonthCursor = { year: number; month: number };

type EventVisual = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  background: string;
  pillBackground: string;
  pillColor: string;
  label: string;
};

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

/** The reference designs "today" as 22 October 2026 — the agenda mock is anchored to it. */
const DESIGN_TODAY = { year: 2026, month: 9, day: 22 } as const;

const CELL_HEIGHT = 42;
const CELL_GAP = 6;

const EVENT_VISUALS: Record<CalendarEvent['type'], EventVisual> = {
  turno: {
    icon: 'medkit',
    iconColor: COLORS.parchment,
    background: COLORS.fucsia,
    pillBackground: alpha(COLORS.fucsia, 0.15),
    pillColor: COLORS.fucsia,
    label: 'Turno',
  },
  vacuna: {
    icon: 'medical',
    iconColor: COLORS.ink,
    background: COLORS.orange,
    pillBackground: alpha(COLORS.orange, 0.25),
    pillColor: COLORS.ink,
    label: 'Vacuna',
  },
  recuerdo: {
    icon: 'book',
    iconColor: COLORS.ink,
    background: COLORS.butter,
    pillBackground: alpha(COLORS.butter, 0.4),
    pillColor: COLORS.ink,
    label: 'Recuerdo',
  },
  cumple: {
    icon: 'book',
    iconColor: COLORS.ink,
    background: COLORS.butter,
    pillBackground: alpha(COLORS.butter, 0.4),
    pillColor: COLORS.ink,
    label: 'Recuerdo',
  },
};

const pad = (value: number) => String(value).padStart(2, '0');

/** Local YYYY-MM-DD key — never built through toISOString so timezones cannot shift the day. */
const toDateKey = (year: number, month: number, day: number) =>
  `${year}-${pad(month + 1)}-${pad(day)}`;

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

/** Monday-first offset: JS returns 0=Sunday, we rotate so 0=Monday. */
const getMondayFirstOffset = (year: number, month: number) =>
  (new Date(year, month, 1).getDay() + 6) % 7;

const buildWeeks = (year: number, month: number): (number | null)[][] => {
  const offset = getMondayFirstOffset(year, month);
  const totalDays = getDaysInMonth(year, month);
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: totalDays }, (_, index) => index + 1),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: (number | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
};

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ pet, events }) => {
  const [cursor, setCursor] = React.useState<MonthCursor>({ year: 2026, month: 9 });
  const [selectedDay, setSelectedDay] = React.useState(22);

  const monthName = MONTH_NAMES[cursor.month];
  const weeks = React.useMemo(
    () => buildWeeks(cursor.year, cursor.month),
    [cursor.year, cursor.month]
  );

  const getEventsForDay = React.useCallback(
    (day: number) => events.filter((event) => event.date === toDateKey(cursor.year, cursor.month, day)),
    [events, cursor.year, cursor.month]
  );

  const selectedEvents = getEventsForDay(selectedDay);

  const isSelectedToday =
    cursor.year === DESIGN_TODAY.year &&
    cursor.month === DESIGN_TODAY.month &&
    selectedDay === DESIGN_TODAY.day;

  const shiftMonth = (delta: number) => {
    const next = new Date(cursor.year, cursor.month + delta, 1);
    const nextYear = next.getFullYear();
    const nextMonth = next.getMonth();
    const nextDays = getDaysInMonth(nextYear, nextMonth);

    setCursor({ year: nextYear, month: nextMonth });
    setSelectedDay((current) => Math.min(current, nextDays));
  };

  const goToToday = () => {
    setCursor({ year: DESIGN_TODAY.year, month: DESIGN_TODAY.month });
    setSelectedDay(DESIGN_TODAY.day);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <View style={styles.headerBadges}>
            <Sticker variant="navy" rotation="none">
              agenda & salud
            </Sticker>
            <View style={styles.privatePill}>
              <Text style={styles.privatePillText}>Privado del dueño</Text>
            </View>
          </View>
          <Text style={styles.title}>Calendario de {pet.name}</Text>
        </View>
      </View>

      {/* Month navigator + calendar grid */}
      <View style={styles.calendarCard}>
        <View style={styles.monthRow}>
          <Pressable
            onPress={() => shiftMonth(-1)}
            style={({ pressed }) => [styles.monthButton, pressed && styles.monthButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Mes anterior"
          >
            <Ionicons name="chevron-back" size={16} color={alpha(COLORS.ink, 0.7)} />
          </Pressable>
          <Text style={styles.monthLabel}>
            {monthName} {cursor.year}
          </Text>
          <Pressable
            onPress={() => shiftMonth(1)}
            style={({ pressed }) => [styles.monthButton, pressed && styles.monthButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Mes siguiente"
          >
            <Ionicons name="chevron-forward" size={16} color={alpha(COLORS.ink, 0.7)} />
          </Pressable>
        </View>

        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((label) => (
            <View key={label} style={styles.weekdaySlot}>
              <Text style={styles.weekdayLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.weeks}>
          {weeks.map((week, weekIndex) => (
            <View key={`week-${weekIndex}`} style={styles.weekRow}>
              {week.map((day, dayIndex) => {
                if (day === null) {
                  return <View key={`empty-${weekIndex}-${dayIndex}`} style={styles.daySlot} />;
                }

                const dayEvents = getEventsForDay(day);
                const hasTurno = dayEvents.some((event) => event.type === 'turno');
                const hasVacuna = dayEvents.some((event) => event.type === 'vacuna');
                const hasRecuerdo = dayEvents.some(
                  (event) => event.type === 'recuerdo' || event.type === 'cumple'
                );
                const hasSplit = hasTurno && hasVacuna;
                const isFilled = hasTurno || hasVacuna;
                const isSelected = selectedDay === day;
                const isToday =
                  cursor.year === DESIGN_TODAY.year &&
                  cursor.month === DESIGN_TODAY.month &&
                  day === DESIGN_TODAY.day;

                return (
                  <View key={`day-${day}`} style={styles.daySlot}>
                    <Pressable
                      onPress={() => setSelectedDay(day)}
                      style={({ pressed }) => [
                        styles.dayCell,
                        !isFilled && styles.dayCellPlain,
                        hasTurno && !hasSplit && styles.dayCellTurno,
                        hasVacuna && !hasSplit && styles.dayCellVacuna,
                        hasSplit && styles.dayCellSplit,
                        isSelected && styles.dayCellSelected,
                        pressed && (isFilled ? styles.dayCellPressedFilled : styles.dayCellPressedPlain),
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`${day} de ${monthName}${dayEvents.length > 0 ? `, ${dayEvents.length} eventos` : ''}`}
                    >
                      {hasSplit ? (
                        <LinearGradient
                          colors={[COLORS.fucsia, COLORS.fucsia, COLORS.orange, COLORS.orange]}
                          locations={[0, 0.5, 0.5, 1]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.splitFill}
                        />
                      ) : null}

                      <Text style={[styles.dayNumber, isFilled && styles.dayNumberFilled]}>
                        {day}
                      </Text>

                      {hasRecuerdo ? <View style={styles.recuerdoDot} /> : null}

                      {isToday && !hasRecuerdo && !hasTurno && !hasVacuna ? (
                        <Text style={styles.todayLabel}>Hoy</Text>
                      ) : null}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.fucsia }]} />
            <Text style={styles.legendLabel}>Turno</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.orange }]} />
            <Text style={styles.legendLabel}>Vacuna</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.butter }]} />
            <Text style={styles.legendLabel}>Recuerdo</Text>
          </View>
        </View>
      </View>

      {/* Selected day agenda */}
      <View style={styles.eventsSection}>
        <View style={styles.eventsHeader}>
          <View style={styles.eventsHeaderText}>
            <Text style={styles.eventsTitle}>
              Agenda del {selectedDay} de {monthName}
            </Text>
            <Text style={styles.eventsSubtitle}>
              {selectedEvents.length}{' '}
              {selectedEvents.length === 1 ? 'evento agendado' : 'eventos agendados'} para este día
            </Text>
          </View>
          {!isSelectedToday ? (
            <Pressable
              onPress={goToToday}
              style={({ pressed }) => pressed && styles.pressedFaint}
              accessibilityRole="button"
              accessibilityLabel="Volver al día de hoy"
            >
              <Text style={styles.todayLink}>Ir a Hoy ({DESIGN_TODAY.day})</Text>
            </Pressable>
          ) : null}
        </View>

        {selectedEvents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar" size={28} color={alpha(COLORS.ink, 0.3)} />
            <Text style={styles.emptyTitle}>
              No hay turnos ni recuerdos agendados para el {selectedDay} de {monthName}.
            </Text>
            <Text style={styles.emptyHint}>
              Tocá los días con colores o círculos amarillos en el calendario para consultar citas y
              recuerdos.
            </Text>
          </View>
        ) : (
          <View style={styles.eventList}>
            {selectedEvents.map((event) => {
              const visual = EVENT_VISUALS[event.type];

              return (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventBody}>
                    <View style={[styles.eventIcon, { backgroundColor: visual.background }]}>
                      <Ionicons name={visual.icon} size={20} color={visual.iconColor} />
                    </View>
                    <View style={styles.eventDetails}>
                      <View style={styles.eventTitleRow}>
                        <Text style={styles.eventTitle}>{event.title}</Text>
                        <View
                          style={[styles.eventTypePill, { backgroundColor: visual.pillBackground }]}
                        >
                          <Text style={[styles.eventTypeText, { color: visual.pillColor }]}>
                            {visual.label}
                          </Text>
                        </View>
                      </View>
                      {event.time ? (
                        <Text style={styles.eventMeta}>
                          {event.time}
                          {event.description ? ` · ${event.description}` : ''}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 12,
    paddingBottom: DOCK_CLEARANCE,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: INK_WASH.hairline,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  privatePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    backgroundColor: alpha(COLORS.navy, 0.1),
  },
  privatePillText: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: COLORS.navy,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '300',
    letterSpacing: -0.3,
    color: COLORS.ink,
  },
  calendarCard: {
    ...CARD_SURFACE,
    padding: 16,
    gap: 16,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthButton: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthButtonPressed: {
    backgroundColor: COLORS.cream,
  },
  monthLabel: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: COLORS.ink,
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  weekdaySlot: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: alpha(COLORS.ink, 0.5),
  },
  weeks: {
    gap: CELL_GAP,
  },
  weekRow: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  daySlot: {
    flex: 1,
    height: CELL_HEIGHT,
  },
  dayCell: {
    height: CELL_HEIGHT,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dayCellPlain: {
    backgroundColor: alpha(COLORS.parchment, 0.6),
  },
  dayCellTurno: {
    backgroundColor: COLORS.fucsia,
  },
  dayCellVacuna: {
    backgroundColor: COLORS.orange,
  },
  dayCellSplit: {
    backgroundColor: COLORS.fucsia,
  },
  dayCellSelected: {
    borderWidth: 2,
    borderColor: COLORS.ink,
    transform: [{ scale: 1.04 }],
    zIndex: 2,
  },
  dayCellPressedPlain: {
    backgroundColor: COLORS.cream,
  },
  dayCellPressedFilled: {
    opacity: 0.85,
  },
  splitFill: {
    ...StyleSheet.absoluteFill,
    borderRadius: RADIUS.md,
  },
  dayNumber: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 12,
    color: COLORS.ink,
  },
  dayNumberFilled: {
    color: COLORS.parchment,
    fontWeight: '700',
  },
  recuerdoDot: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.pill,
    marginTop: 2,
    backgroundColor: COLORS.butter,
  },
  todayLabel: {
    fontFamily: FONTS.sans,
    fontSize: 7.5,
    lineHeight: 9,
    fontWeight: '700',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
    color: COLORS.fucsia,
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    columnGap: 16,
    rowGap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: INK_WASH.hairline,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: RADIUS.pill,
  },
  legendLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
    color: alpha(COLORS.ink, 0.75),
  },
  eventsSection: {
    gap: 12,
  },
  eventsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  eventsHeaderText: {
    flex: 1,
    gap: 2,
  },
  eventsTitle: {
    fontFamily: FONTS.serif,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '600',
    color: COLORS.ink,
  },
  eventsSubtitle: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 16,
    color: alpha(COLORS.ink, 0.55),
  },
  todayLink: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    color: COLORS.fucsia,
  },
  pressedFaint: {
    opacity: 0.6,
  },
  eventList: {
    gap: 10,
  },
  eventCard: {
    ...CARD_SURFACE,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  eventBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  eventIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventDetails: {
    flex: 1,
    gap: 2,
  },
  eventTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventTitle: {
    flexShrink: 1,
    fontFamily: FONTS.serif,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
    color: COLORS.ink,
  },
  eventTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  eventTypeText: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  eventMeta: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    color: alpha(COLORS.ink, 0.6),
  },
  emptyCard: {
    ...CARD_SURFACE,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: FONTS.serif,
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
    textAlign: 'center',
    color: COLORS.ink,
  },
  emptyHint: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    maxWidth: 280,
    color: alpha(COLORS.ink, 0.5),
  },
});
