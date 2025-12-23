import { useCallback } from 'react';
import Booking from './booking';
import { THEME_COLOR_OPTIONS } from './constants/theme';

import './app.css';

const getCustomThemeColor = (themeColor) => {
  return (
    THEME_COLOR_OPTIONS.find(
      (option) => option.modeColor === themeColor
    ) || THEME_COLOR_OPTIONS[0]
  );
};

function App() {
  const getGlobalStyle = useCallback(() => {
    const customThemeColor = getCustomThemeColor('#1D2838');
    const globalStyle = {
      '--btn-bg-color': customThemeColor.btnBGColor,
      '--btn-bg-color-40': `${customThemeColor.btnBGColor}40`,
      '--btn-bg-color-70': `${customThemeColor.btnBGColor}70`,
      '--btn-hover-bg-color': customThemeColor.btnHoverBGColor,
      '--active-text-color': customThemeColor.activeTextColor,
    };
    return globalStyle;
  }, []);

  return (
    <div className="custom-page custom-page-booking theme-mode-dark" style={getGlobalStyle()}>
      <Booking />
    </div>
  );
}

export default App;
