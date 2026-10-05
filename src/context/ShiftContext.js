import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { setCurrentStaffId } from '../services/orders';

const KEY = 'shift_staff';
const ShiftContext = createContext(null);

export function ShiftProvider({ children }) {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore shift on cold start
  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.id) {
            setStaff(parsed);
            setCurrentStaffId(parsed.id);
          }
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const checkIn = async (staffObj) => {
    setStaff(staffObj);
    setCurrentStaffId(staffObj.id);
    await SecureStore.setItemAsync(KEY, JSON.stringify(staffObj));
  };

  const checkOut = async () => {
    setStaff(null);
    setCurrentStaffId(null);
    await SecureStore.deleteItemAsync(KEY);
  };

  return (
    <ShiftContext.Provider value={{ staff, loading, checkIn, checkOut }}>
      {children}
    </ShiftContext.Provider>
  );
}

export const useShift = () => {
  const ctx = useContext(ShiftContext);
  if (!ctx) throw new Error('useShift must be used inside ShiftProvider');
  return ctx;
};