import { createContext, useContext } from 'react';

const DashboardContext = createContext(null);

export function DashboardProvider({ children, onSignOut }) {
  return (
    <DashboardContext.Provider value={{ onSignOut }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
}
