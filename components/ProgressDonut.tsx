import { memo, useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface ProgressDonutProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor: string;
  textColor: string;
  glowColor: string;
  completedCount: number;
  totalCount: number;
  subtitleColor: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ProgressDonut = memo(({
  progress,
  size = 160,
  strokeWidth = 12,
  color,
  trackColor,
  textColor,
  glowColor,
  completedCount,
  totalCount,
  subtitleColor,
}: ProgressDonutProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Arc value — drives SVG strokeDashoffset directly, no setState
  const arcValue = useRef(new Animated.Value(progress)).current;

  // Counter value — separate from arc so they never interfere
  const counterValue = useRef(new Animated.Value(progress)).current;

  const [displayPercent, setDisplayPercent] = useState(Math.round(progress));
  const [displayCount, setDisplayCount] = useState(completedCount);

  useEffect(() => {
    arcValue.stopAnimation();
    counterValue.stopAnimation();

    // Arc animates independently — no listener, no setState
    Animated.timing(arcValue, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();

    // Counter uses throttled listener — fires every ~50ms, not every frame
    let lastUpdate = 0;
    const prevProgress = (counterValue as any)._value ?? progress;
    const id = counterValue.addListener(({ value }) => {
      const now = Date.now();
      if (now - lastUpdate < 50) return;
      lastUpdate = now;
      setDisplayPercent(Math.round(value));
    });

    Animated.timing(counterValue, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start(() => {
      counterValue.removeListener(id);
      setDisplayPercent(Math.round(progress));
    });
  }, [progress]);

  useEffect(() => {
    setDisplayCount(completedCount);
  }, [completedCount]);

  const strokeDashoffset = arcValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  const isComplete = progress === 100 && totalCount > 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>

      {/* Glow */}
      <View style={{
        position: 'absolute',
        width: size + strokeWidth * 2,
        height: size + strokeWidth * 2,
        borderRadius: (size + strokeWidth * 2) / 2,
        backgroundColor: glowColor,
        opacity: 0.25,
      }} />

      {/* SVG arc */}
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>

      {/* Center text */}
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[styles.percent, { color: textColor, fontSize: size * 0.27 }]}>
          {displayPercent}%
        </Text>
        <Text style={[styles.subtitle, { color: subtitleColor, fontSize: size * 0.1 }]}>
          {isComplete ? 'All done' : `${displayCount} of ${totalCount}`}
        </Text>
      </View>

    </View>
  );
});

export default ProgressDonut;

const styles = StyleSheet.create({
  percent: { fontWeight: '800', letterSpacing: -1 },
  subtitle: { fontWeight: '500', marginTop: 2, letterSpacing: 0.1 },
});
