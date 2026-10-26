import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { alpha, COLORS, INK_WASH, RADIUS, SHADOWS, TEXT } from '../theme';
import { Sticker } from './Sticker';

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  description?: string;
  accent?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Shared bottom-sheet shell: warm parchment surface, soft rounded top corners,
 * no black borders, generous breathing room. Every modal in Lovi uses this.
 */
export const AppModal: React.FC<AppModalProps> = ({
  visible,
  onClose,
  title,
  eyebrow,
  description,
  accent = COLORS.fucsia,
  children,
  footer,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar modal" />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardLayer}
          pointerEvents="box-none"
        >
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={styles.headerText}>
                {eyebrow ? (
                  <Sticker variant="parchment" style={{ backgroundColor: alpha(accent, 0.12), borderColor: alpha(accent, 0.22) }}>
                    {eyebrow}
                  </Sticker>
                ) : null}
                <Text style={[TEXT.headline, styles.title]}>{title}</Text>
                {description ? <Text style={[TEXT.body, styles.description]}>{description}</Text> : null}
              </View>

              <Pressable
                onPress={onClose}
                hitSlop={10}
                style={({ pressed }) => [styles.close, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <Ionicons name="close" size={18} color={INK_WASH.medium} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>

            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: alpha(COLORS.ink, 0.45),
  },
  keyboardLayer: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.parchment,
    borderTopLeftRadius: RADIUS.xxxl,
    borderTopRightRadius: RADIUS.xxxl,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '90%',
    ...SHADOWS.dock,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: alpha(COLORS.ink, 0.14),
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 14,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  title: {
    marginTop: 2,
  },
  description: {
    marginTop: 2,
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cream,
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    paddingBottom: 8,
    gap: 14,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: INK_WASH.hairline,
    marginTop: 8,
    gap: 10,
  },
});
