import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { COLORS, FONTS, INK_WASH, RADIUS, SHADOWS } from '../theme';
import { AppModal } from './AppModal';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Destructive confirmation sheet built on `AppModal`.
 *
 * `Alert` is not used on purpose: it is unreliable on `react-native-web`, and the web build
 * is a first-class target here. Every "are you sure?" flow in Lovi goes through this modal.
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  destructive = true,
  pending = false,
  error = null,
  onCancel,
  onConfirm,
}) => {
  return (
    <AppModal
      visible={visible}
      onClose={onCancel}
      eyebrow="confirmación"
      title={title}
      description={error || description}
      accent={destructive ? COLORS.fucsia : COLORS.dock}
      footer={
        <>
          <Pressable
            onPress={onConfirm}
            disabled={pending}
            style={({ pressed }) => [
              styles.confirm,
              destructive ? styles.confirmDestructive : styles.confirmNeutral,
              pending && styles.disabled,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={confirmLabel}
            accessibilityState={{ disabled: pending, busy: pending }}
          >
            {pending ? (
              <ActivityIndicator size="small" color={COLORS.parchment} />
            ) : (
              <Text style={styles.confirmLabel}>{confirmLabel}</Text>
            )}
          </Pressable>

          <Pressable
            onPress={onCancel}
            disabled={pending}
            style={({ pressed }) => [
              styles.cancel,
              pending && styles.disabled,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
            accessibilityState={{ disabled: pending }}
          >
            <Text style={styles.cancelLabel}>{cancelLabel}</Text>
          </Pressable>
        </>
      }
    >
      {null}
    </AppModal>
  );
};

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.45,
  },
  confirm: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
  },
  confirmDestructive: {
    backgroundColor: COLORS.fucsia,
    ...SHADOWS.fucsiaGlow,
  },
  confirmNeutral: {
    backgroundColor: COLORS.dock,
    ...SHADOWS.darkGlow,
  },
  confirmLabel: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: COLORS.parchment,
  },
  cancel: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  cancelLabel: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: INK_WASH.medium,
  },
});
