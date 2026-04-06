import { useUIStore } from '../store/useUIStore';
import { Colors, Theme } from '../constants/colors';

export const useTheme = (): Theme => {
  const isDarkMode = useUIStore(s => s.isDarkMode);
  return isDarkMode ? Colors.dark : Colors.light;
};
