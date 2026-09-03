import { useCallback, useEffect, useState } from "react";
import { db, isFirebaseConfigured } from "../firebase.js";
import { collection, addDoc, onSnapshot, orderBy, query } from "firebase/firestore";

const STORAGE_KEY = "espetim_closings_v1";

// Histórico de fechamentos de caixa — mesmo esquema do useOrders (Firestore
// se configurado, senão localStorage). Cada fechamento é um retrato fixo do
// dia no momento em que a equipe clicou em "Fechar caixa".

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocal(closings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(closings));
  } catch (e) {
    /* localStorage indisponível — segue só em memória */
  }
}

export function useClosings() {
  const [closings, setClosings] = useState(isFirebaseConfigured ? [] : loadLocal);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const q = query(collection(db, "closings"), orderBy("closedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setClosings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (isFirebaseConfigured) return;
    function onStorage(e) {
      if (e.key === STORAGE_KEY) setClosings(loadLocal());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addClosing = useCallback((data) => {
    const payload = { closedAt: Date.now(), ...data };
    if (isFirebaseConfigured) {
      return addDoc(collection(db, "closings"), payload);
    }
    setClosings((prev) => {
      const next = [{ id: "c" + Date.now(), ...payload }, ...prev];
      saveLocal(next);
      return next;
    });
    return Promise.resolve();
  }, []);

  return { closings, addClosing };
}