import { useCallback, useEffect, useState } from "react";
import { nextStatus } from "../data/menu.js";
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

// -----------------------------------------------------------------------
// Guarda e sincroniza os pedidos.
//
// Com o Firebase configurado (veja src/firebase.js), os pedidos ficam no
// Firestore: o celular do cliente e o painel — em qualquer aparelho —
// enxergam a mesma lista, em tempo real.
//
// Sem o Firebase configurado, cai automaticamente para o localStorage do
// navegador: continua funcionando, mas só sincroniza entre abas do MESMO
// aparelho (é o modo "básico", sem nenhuma configuração extra).
// -----------------------------------------------------------------------

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
  } catch (e) {
    /* localStorage indisponível — segue só em memória */
  }
}

export function useOrders() {
  const [orders, setOrders] = useState(isFirebaseConfigured ? [] : loadLocal);
  const [synced, setSynced] = useState(false); // true = conectado na nuvem (Firestore)

  // ---- modo Firestore (nuvem) ----
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

  // ---- modo localStorage (mesmo aparelho, entre abas) ----
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
        const next = nextStatus(current.status, current.fulfillment);
        if (!next) return;
        return updateDoc(doc(db, "orders", id), { status: next, updatedAt: Date.now() });
      }
      setOrders((prev) => {
        const next = prev.map((o) => {
          if (o.id !== id) return o;
          const n = nextStatus(o.status, o.fulfillment);
          if (!n) return o;
          return { ...o, status: n, updatedAt: Date.now() };
        });
        saveLocal(next);
        return next;
      });
    },
    [orders]
  );

  // Atualiza campos soltos de um pedido (ex: valor recebido/troco da
  // calculadora de dinheiro) sem mexer no status.
  const updateOrder = useCallback((id, patch) => {
    if (isFirebaseConfigured) {
      return updateDoc(doc(db, "orders", id), { ...patch, updatedAt: Date.now() });
    }
    setOrders((prev) => {
      const next = prev.map((o) => (o.id === id ? { ...o, ...patch, updatedAt: Date.now() } : o));
      saveLocal(next);
      return next;
    });
    return Promise.resolve();
  }, []);

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

  // Remove vários pedidos de uma vez — usado no fechamento de caixa pra
  // tirar do quadro os pedidos do dia que já foram arquivados.
  const removeOrders = useCallback((ids) => {
    if (!ids || ids.length === 0) return Promise.resolve();
    if (isFirebaseConfigured) {
      return Promise.all(ids.map((id) => deleteDoc(doc(db, "orders", id))));
    }
    setOrders((prev) => {
      const idSet = new Set(ids);
      const next = prev.filter((o) => !idSet.has(o.id));
      saveLocal(next);
      return next;
    });
    return Promise.resolve();
  }, []);

  return {
    orders,
    addOrder,
    advanceOrder,
    updateOrder,
    cancelOrder,
    removeOrders,
    synced: isFirebaseConfigured ? synced : "local",
  };
}