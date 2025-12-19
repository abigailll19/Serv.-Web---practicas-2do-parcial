export interface ResenaCreatedEvent {
  event_id: string;
  event_type: 'resena.created' | 'resena.low_rating';
  timestamp: string;
  idempotency_key: string;
  payload: {
    resena_id: string;
    usuario_id: number;
    destino: string;
    mensaje: string;
    calificacion: number;
    created_at: string;
  };
}
