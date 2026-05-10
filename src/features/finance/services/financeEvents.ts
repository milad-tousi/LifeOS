const TRANSACTION_ADDED_EVENT = "lifeos:finance:transactionAdded";

export function emitFinanceTransactionAdded(): void {
  window.dispatchEvent(new CustomEvent(TRANSACTION_ADDED_EVENT));
}

export function onFinanceTransactionAdded(fn: () => void): () => void {
  window.addEventListener(TRANSACTION_ADDED_EVENT, fn);
  return () => window.removeEventListener(TRANSACTION_ADDED_EVENT, fn);
}
