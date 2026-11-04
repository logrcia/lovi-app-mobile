import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
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
  /**
   * `sheet` (default) slides up from the bottom edge. `center` floats a card in the middle of
   * the screen, for short lists that would otherwise sit low, next to the dock.
   */
  placement?: 'sheet' | 'center';
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
  placement = 'sheet',
}) => {
  const insets = useSafeAreaInsets();
  const centered = placement === 'center';
  // The centered layer sizes to its content, so a percentage max height has nothing to resolve
  // against and the card collapses. The window height is a definite bound.
  const { height: windowHeight } = useWindowDimensions();

  const overlay = (
    <>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar modal" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.keyboardLayer, centered && styles.keyboardLayerCentered]}
        pointerEvents="box-none"
      >
        <View
          style={
            centered
              ? [styles.sheet, styles.card, { maxHeight: Math.round(windowHeight * 0.75) }]
              : [styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]
          }
        >
          {centered ? null : <View style={styles.handle} />}

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
    </>
  );

  // `react-native-web` portals `Modal` onto `document.body`, which would escape the phone-width
  // frame set in App.tsx. Render the sheet inline on web so it stays inside the frame.
  if (Platform.OS === 'web') {
    if (!visible) return null;
    return (
      <View style={[styles.root, styles.webOverlay, centered && styles.rootCentered]}>
        {overlay}
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.root, centered && styles.rootCentered]}>{overlay}</View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  rootCentered: {
    justifyContent: 'center',
  },
  webOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 20,
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
  keyboardLayerCentered: {
    justifyContent: 'center',
    paddingHorizontal: 20,
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
  card: {
    borderRadius: RADIUS.xxxl,
    paddingTop: 20,
    paddingBottom: 16,
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
