import { useCallback, useEffect } from 'react';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Loading } from 'dtable-ui-component';
import Booking from './booking';
import { useApp } from './hooks/app';
import { THEME_COLOR_OPTIONS } from './constants/theme';
import { LOCALES } from './locales';

import './app.css';

const getCustomThemeColor = (themeColor) => {
  return (
    THEME_COLOR_OPTIONS.find(
      (option) => option.modeColor === themeColor
    ) || THEME_COLOR_OPTIONS[0]
  );
};

function App() {
  const { isLoading, lang, appThemeMode, appThemeColor } = useApp();

  const getGlobalStyle = useCallback(() => {
    if (isLoading) return {};
    const fixedThemeColor = appThemeColor || '#FFFFFF';
    const customThemeColor = getCustomThemeColor(fixedThemeColor);
    const globalStyle = {
      '--btn-bg-color': customThemeColor.btnBGColor,
      '--btn-bg-color-40': `${customThemeColor.btnBGColor}40`,
      '--btn-bg-color-70': `${customThemeColor.btnBGColor}70`,
      '--btn-hover-bg-color': customThemeColor.btnHoverBGColor,
      '--active-text-color': customThemeColor.activeTextColor,
    };
    return globalStyle;
  }, [isLoading, appThemeColor]);

  useEffect(() => {
    intl.init({ currentLocale: lang || 'en', locales: LOCALES });
  }, [lang]);

  return (
    <div className={classnames('custom-page custom-page-booking', { 'theme-mode-dark': appThemeMode === 'dark' })} style={getGlobalStyle()}>
      {isLoading && (
        <div className="loading-wrapper">
          <Loading />
        </div>
      )}
      {!isLoading && (
        <Booking />
      )}
    </div>
  );
}

export default App;
