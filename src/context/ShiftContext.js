import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { setCurrentStaffId } from '../services/orders';
import { staffApi } from '../services/staff';
import { useAuth } from './AuthContext';

const KEY = 'shift_staff';
const ShiftContext = createContext(null);

export function ShiftProvider({ children }) {
  const { user } = useAuth();
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staffCount, setStaffCount] = useState(0);
  const prevUserRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.id) {
            setStaff(parsed);
            setCurrentStaffId(parsed.id);
          }
        }
      } catch (e) {
        // ignore
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!user) {
      setStaffCount(0);
      return;
    }
    (async () => {
      try {
        const data = await staffApi.list();
        const active = (data.staff || []).filter((s) => s.isActive).length;
        setStaffCount(active);
      } catch (e) {
        // leave at 0
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user && prevUserRef.current) {
      checkOut();
    }
    prevUserRef.current = user;
  }, [user]);

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
    <ShiftContext.Provider
      value={{ staff, loading, staffCount, checkIn, checkOut }}
    >
      {children}
    </ShiftContext.Provider>
  );
}

export const useShift = () => {
  const ctx = useContext(ShiftContext);
  if (!ctx) throw new Error('useShift must be used inside ShiftProvider');
  return ctx;
};