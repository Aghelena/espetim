import { useCallback, useEffect, useState } from "react";
import { STATUS_FLOW } from "../data/menu.js";
import { db, isFirebaseConfigured } from "../firebase.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

const STORAGE_KEY = "espetim_orders_v1";

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocal(orders) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {}
}

export function useOrders() {
  const [orders, setOrders] = useState(isFirebaseConfigured ? [] : loadLocal);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(db, "orders"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setSynced(true);
      },
      () => setSynced(false)
    );
    return unsub;
  }, []);

  useEffect(() => {
    if (isFirebaseConfigured) return;
    function onStorage(e) {
      if (e.key === STORAGE_KEY) setOrders(loadLocal());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addOrder = useCallback((data, status = "recebido") => {
    const now = Date.now();
    const payload = { status, createdAt: now, updatedAt: now, ...data };
    if (isFirebaseConfigured) {
      return addDoc(collection(db, "orders"), payload);
    }
    setOrders((prev) => {
      const next = [...prev, { id: "o" + now + "-" + Math.random().toString(36).slice(2, 7), ...payload }];
      saveLocal(next);
      return next;
    });
    return Promise.resolve();
  }, []);

  const advanceOrder = useCallback(
    (id) => {
      if (isFirebaseConfigured) {
        const current = orders.find((o) => o.id === id);
        if (!current) return;
        const i = STATUS_FLOW.indexOf(current.status);
        if (i < 0 || i >= STATUS_FLOW.length - 1) return;
        return updateDoc(doc(db, "orders", id), { status: STATUS_FLOW[i + 1], updatedAt: Date.now() });
      }
      setOrders((prev) => {
        const next = prev.map((o) => {
          if (o.id !== id) return o;
          const i = STATUS_FLOW.indexOf(o.status);
          if (i < 0 || i >= STATUS_FLOW.length - 1) return o;
          return { ...o, status: STATUS_FLOW[i + 1], updatedAt: Date.now() };
        });
        saveLocal(next);
        return next;
      });
    },
    [orders]
  );

  const cancelOrder = useCallback((id) => {
    if (isFirebaseConfigured) {
      return deleteDoc(doc(db, "orders", id));
    }
    setOrders((prev) => {
      const next = prev.filter((o) => o.id !== id);
      saveLocal(next);
      return next;
    });
  }, []);

  return { orders, addOrder, advanceOrder, cancelOrder, synced: isFirebaseConfigured ? synced : "local" };
}