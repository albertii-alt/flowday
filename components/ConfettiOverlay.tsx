import { forwardRef, memo } from 'react';
import ConfettiCannon from 'react-native-confetti-cannon';
import { Dimensions } from 'react-native';

const ORIGIN = { x: Dimensions.get('window').width / 2, y: -20 };
const COLORS = ['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#fff'];

const ConfettiOverlay = memo(
  forwardRef<ConfettiCannon>((_, ref) => (
    <ConfettiCannon
      ref={ref}
      count={80}
      origin={ORIGIN}
      autoStart={false}
      fadeOut
      fallSpeed={2500}
      explosionSpeed={300}
      colors={COLORS}
    />
  ))
);

export default ConfettiOverlay;
