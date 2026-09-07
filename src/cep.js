// Busca de endereço por CEP via ViaCEP — gratuito, sem chave de API. Só
// ajuda a preencher o formulário mais rápido; se a busca falhar ou o CEP
// não existir, a pessoa continua preenchendo à mão normalmente.
import { LOW_FEE_CEP_RANGES } from "./data/menu.js";

// Decide o frete sozinho a partir do CEP, usando as faixas cadastradas em
// data/menu.js — não depende do nome do bairro que a ViaCEP devolve (o
// nome oficial dos Correios às vezes não bate com o nome usado na loja).
// Retorna o nome do bairro de frete mais barato, ou null se o CEP cair
// fora das faixas (frete no valor padrão).
export function zoneForCEP(cep) {
  const digits = String(cep || "").replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const n = parseInt(digits, 10);
  const hit = LOW_FEE_CEP_RANGES.find((r) => n >= r.from && n <= r.to);
  return hit ? hit.zone : null;
}

export function formatCEP(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return digits.slice(0, 5) + "-" + digits.slice(5);
}

export async function lookupCEP(cep) {
  const digits = String(cep || "").replace(/\D/g, "");
  if (digits.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.erro) return null;
    return {
      logradouro: data.logradouro || "",
      bairro: data.bairro || "",
      cidade: data.localidade || "",
      uf: data.uf || "",
    };
  } catch (e) {
    return null;
  }
}