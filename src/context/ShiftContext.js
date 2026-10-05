import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { setCurrentStaffId } from '../services/orders';
import { staffApi } from '../services/staff';
import { shiftsApi } from '../services/shifts';
import { useAuth } from './AuthContext';

const KEY_STAFF = 'shift_staff';
const ShiftContext = createContext(null);

export function ShiftProvider({ children }) {
  const { user } = useAuth();
  const [currentShift, setCurrentShift] = useState(null);
  const [staff, setStaff] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [staffCount, setStaffCount] = useState(0);
  const prevUserRef = useRef(null);

  // Cold start — restore cached staff, and clear any stale lock key
  // from an earlier version. The lock is in-memory only now.
  useEffect(() => {
    SecureStore.deleteItemAsync('shift_locked').catch(() => {});

    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(KEY_STAFF);
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

  // Whenever the user changes, refresh the shift from the backend.
  useEffect(() => {
    if (!user) {
      setCurrentShift(null);
      setStaff(null);
      setCurrentStaffId(null);
      setIsLocked(false);
      setStaffCount(0);
      return;
    }
    (async () => {
      try {
        const data = await shiftsApi.current();
        if (data?.shift) {
          setCurrentShift(data.shift);
          const s = {
            id: data.shift.staffId,
            name: data.shift.staffName || 'Staff',
            shopId: data.shift.shopId,
          };
          setStaff(s);
          setCurrentStaffId(s.id);
          await SecureStore.setItemAsync(KEY_STAFF, JSON.stringify(s));
        } else {
          setCurrentShift(null);
          setStaff(null);
          setCurrentStaffId(null);
          await SecureStore.deleteItemAsync(KEY_STAFF);
        }
      } catch (e) {
        // Network failure — keep local cache, don't wipe
      }
      try {
        const staffData = await staffApi.list();
        const active = (staffData.staff || []).filter((s) => s.isActive).length;
        setStaffCount(active);
      } catch (e) {
        // leave at 0
      }
    })();
  }, [user]);

  // Clear everything when the user logs out
  useEffect(() => {
    if (!user && prevUserRef.current) {
      checkOut();
    }
    prevUserRef.current = user;
  }, [user]);

  const openShift = useCallback(async (staffObj, openingFloat = null) => {
    const data = await shiftsApi.open({
      staffId: staffObj?.id,
      openingFloat,
    });
    const shift = data.shift;
    setCurrentShift(shift);
    const s = {
      id: shift.staffId,
      name: shift.staffName || staffObj?.name || 'Staff',
      role: staffObj?.role,
      shopId: shift.shopId,
    };
    setStaff(s);
    setCurrentStaffId(s.id);
    setIsLocked(false);
    await SecureStore.setItemAsync(KEY_STAFF, JSON.stringify(s));
    return shift;
  }, []);

  const closeShift = useCallback(async ({ countedCash, notes } = {}) => {
    if (!currentShift) return null;
    const result = await shiftsApi.close(currentShift.id, { countedCash, notes });
    setCurrentShift(null);
    setStaff(null);
    setCurrentStaffId(null);
    setIsLocked(false);
    await SecureStore.deleteItemAsync(KEY_STAFF);
    return result;
  }, [currentShift]);

  const checkOut = useCallback(async () => {
    if (currentShift) {
      try {
        await shiftsApi.close(currentShift.id, {});
      } catch (e) {
        console.warn('Failed to close shift on backend:', e.message);
      }
    }
    setCurrentShift(null);
    setStaff(null);
    setCurrentStaffId(null);
    setIsLocked(false);
    await SecureStore.deleteItemAsync(KEY_STAFF);
  }, [currentShift]);

  // Lock is in-memory only. Force-closing the app clears it.
  const lock = useCallback(() => {
    if (!staff) return;
    setIsLocked(true);
  }, [staff]);

  const unlock = useCallback(() => {
    setIsLocked(false);
  }, []);

  return (
    <ShiftContext.Provider
      value={{
        staff,
        loading,
        staffCount,
        isLocked,
        checkOut,
        currentShift,
        openShift,
        closeShift,
        lock,
        unlock,
      }}
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