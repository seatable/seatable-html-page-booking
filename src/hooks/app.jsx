import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import context from '@/context';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [lang, setLang] = useState('zh-cn');

  const init = useCallback(async () => {
    const lang = await context.getLang();
    setLang(lang);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <AppContext.Provider value={{
      isLoading,
      appThemeMode: 'dark',
      appThemeColor: '#1D2838',
      lang,
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
