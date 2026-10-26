import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType, LayoutChangeEvent, StyleProp, ViewStyle } from 'react-native';

interface AspectImageProps {
  source: ImageSourcePropType;
  /** Frame ratio as width divided by height, e.g. `4 / 3`. */
  ratio: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  children?: React.ReactNode;
}

/**
 * Image frame with a deterministic aspect ratio.
 *
 * `aspectRatio` combined with `width: '100%'` leaves the height undefined at runtime,
 * so the image falls back to its intrinsic height and grows past its card. Measuring
 * the frame and setting a numeric height keeps the ratio exact on every device.
 */
export const AspectImage: React.FC<AspectImageProps> = ({
  source,
  ratio,
  style,
  accessibilityLabel,
  children,
}) => {
  const [width, setWidth] = React.useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (Math.abs(nextWidth - width) > 0.5) {
      setWidth(nextWidth);
    }
  };

  return (
    <View
      style={[styles.frame, style, width > 0 ? { height: width / ratio } : null]}
      onLayout={handleLayout}
    >
      {width > 0 ? (
        <Image
          source={source}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityLabel={accessibilityLabel}
        />
      ) : null}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    overflow: 'hidden',
  },
});
