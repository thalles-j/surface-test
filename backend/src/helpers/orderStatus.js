export const ORDER_STATUS = {
  PENDENTE: 'pendente',
  CONFIRMADO: 'confirmado',
  EM_SEPARACAO: 'em_separacao',
  ENVIADO: 'enviado',
  FINALIZADO: 'finalizado',
  CANCELADO: 'cancelado',
  PROCESSANDO: 'processando',
  CONCLUIDO: 'concluido',
};

export const STATUS_LABELS = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  em_separacao: 'Em Separação',
  enviado: 'Enviado',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
  processando: 'Processando',
  concluido: 'Concluído',
};

const TRANSITIONS = {
  pendente: ['confirmado', 'cancelado'],
  confirmado: ['em_separacao', 'cancelado'],
  em_separacao: ['enviado', 'cancelado'],
  enviado: ['finalizado'],
  finalizado: [],
  cancelado: [],
  processando: ['enviado', 'finalizado', 'cancelado'],
  concluido: [],
};

export function isValidTransition(currentStatus, newStatus) {
  const allowed = TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(newStatus);
}

export function getAllStatuses() {
  return Object.values(ORDER_STATUS);
}

export function getNextStatuses(currentStatus) {
  return TRANSITIONS[currentStatus] || [];
}
