import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const OlympicsContext = createContext(null);

export function OlympicsProvider({ children }) {
  const [olympicsList, setOlympicsList] = useState([]);
  const [activeOlympics, setActiveOlympics] = useState(null);
  const [selectedOlympicsId, setSelectedOlympicsId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOlympics();
  }, []);

  async function loadOlympics() {
    setIsLoading(true);
    try {
      const list = await api.getOlympics();
      setOlympicsList(list);

      // Find the active Olympics
      const active = list.find(o => o.is_active);
      setActiveOlympics(active || null);

      // Default to active Olympics or first in list
      if (!selectedOlympicsId) {
        const defaultId = active?.id || (list.length > 0 ? list[0].id : null);
        setSelectedOlympicsId(defaultId);
      }
    } catch (err) {
      console.error('Failed to load Olympics:', err);
    } finally {
      setIsLoading(false);
    }
  }

  function selectOlympics(id) {
    setSelectedOlympicsId(id);
  }

  const selectedOlympics = olympicsList.find(o => o.id === selectedOlympicsId) || null;

  return (
    <OlympicsContext.Provider value={{
      olympicsList,
      activeOlympics,
      selectedOlympics,
      selectedOlympicsId,
      selectOlympics,
      refreshOlympics: loadOlympics,
      isLoading,
    }}>
      {children}
    </OlympicsContext.Provider>
  );
}

export function useOlympics() {
  const context = useContext(OlympicsContext);
  if (!context) {
    throw new Error('useOlympics must be used within an OlympicsProvider');
  }
  return context;
}
