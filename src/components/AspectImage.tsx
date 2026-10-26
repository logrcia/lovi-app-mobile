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
 * React Native prepends the asset's intrinsic width/height to the image style, so any
 * dimension the caller does not override is the photo's natural size: a `width: '100%'`
 * image keeps its native height and the picture renders oversized inside its frame.
 * This frame measures itself, sets a numeric height, and forces both image dimensions.
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
          style={[StyleSheet.absoluteFill, styles.image]}
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
  /**
   * Both dimensions must be set: React Native prepends the asset's intrinsic
   * width/height to the image style, and anything not overridden here wins.
   */
  image: {
    width: '100%',
    height: '100%',
  },
});
