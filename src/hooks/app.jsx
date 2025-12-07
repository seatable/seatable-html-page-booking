import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import context from '@/context';
import { APP_CHANGED_EVENT_TYPE } from 'seatable-html-page-sdk';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [appThemeMode, setAppThemeMode] = useState('');
  const [appThemeColor, setAppThemeColor] = useState(null);
  const [server, setServer] = useState('');
  const [appUuid, setAppUuid] = useState('');
  const [lang, setLang] = useState('en');
  const [tables, setTables] = useState([]);

  const init = useCallback(async () => {
    const appThemeMode = await context.getAppThemeMode();
    const appThemeColor = await context.getAppThemeColor(appThemeMode);
    const server = await context.getAppSetting('server');
    const appUuid = await context.getAppSetting('appUuid');
    const lang = await context.getAppSetting('lang');
    const tables = await context.getTables();
    setAppThemeMode(appThemeMode);
    setAppThemeColor(appThemeColor);
    setServer(server);
    setAppUuid(appUuid);
    setLang(lang);
    setTables(tables);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const unsubscribe = context.subscribeAppChanged(({ type, updates }) => {
      if (type === APP_CHANGED_EVENT_TYPE.THEME_MODE_CHANGED) {
        setAppThemeMode(updates.app_theme_mode);
        setAppThemeColor(updates.app_theme_color);
      }
      if (type === APP_CHANGED_EVENT_TYPE.THEME_COLOR_CHANGED) {
        setAppThemeColor(updates.app_theme_color);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <AppContext.Provider value={{
      isLoading,
      appThemeMode,
      appThemeColor,
      server,
      appUuid,
      lang,
      tables,
    }}>
      {children}
    </AppContext.Provider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node,
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('\'AppContext\' is null');
  return context;
};
