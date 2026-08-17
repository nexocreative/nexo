export interface NetBalance {
  userId: string;
  net: number; // positivo = le deben, negativo = debe
}

export interface SettlementTx {
  from: string;
  to: string;
  amount: number;
}

const EPS = 0.005;

/**
 * Algoritmo greedy de "debt simplification": a partir del balance neto de
 * cada persona en el grupo (sin importar entre quién y quién se originó esa
 * deuda), calcula el número mínimo de pagos para saldar todas las cuentas,
 * emparejando en cada paso al mayor deudor con el mayor acreedor.
 *
 * Como opera sobre el neto de cada persona (no sobre las deudas originales
 * por pares), los ciclos se cancelan solos: si A, B y C se deben 10€ en
 * círculo, el neto de los tres es 0 y esta función no genera ningún pago.
 */
export function simplifyDebts(balances: NetBalance[]): SettlementTx[] {
  const debtors = balances
    .filter((b) => b.net < -EPS)
    .map((b) => ({ ...b }))
    .sort((a, b) => a.net - b.net); // más negativo primero
  const creditors = balances
    .filter((b) => b.net > EPS)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.net - a.net); // más positivo primero

  const txs: SettlementTx[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(-debtor.net, creditor.net);

    if (amount > EPS) {
      txs.push({ from: debtor.userId, to: creditor.userId, amount: Math.round(amount * 100) / 100 });
      debtor.net += amount;
      creditor.net -= amount;
    }

    if (Math.abs(debtor.net) <= EPS) i++;
    if (Math.abs(creditor.net) <= EPS) j++;
  }

  return txs;
}
