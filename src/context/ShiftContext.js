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

  // On logout: local cleanup only. The caller should have already closed
  // the shift via checkOut() while the token was valid. Any backend call
  // from this path would 401 because AuthContext has already cleared the
  // token by the time this effect fires.
  useEffect(() => {
    if (!user && prevUserRef.current) {
      setCurrentShift(null);
      setStaff(null);
      setCurrentStaffId(null);
      setIsLocked(false);
      SecureStore.deleteItemAsync(KEY_STAFF).catch(() => {});
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

  // Close the backend shift (if any) and clear local state. Call this
  // while the auth token is still valid — e.g. from ProfileScreen's
  // sign-out handler, or from the lock screen's sign-out escape hatch.
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