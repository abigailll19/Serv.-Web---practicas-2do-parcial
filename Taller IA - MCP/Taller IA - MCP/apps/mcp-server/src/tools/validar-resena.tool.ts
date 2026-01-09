// Tool 2: Validación de reglas de negocio
export const validarResenaTool = {
  name: "validar_resena",
  description: "Valida las reglas de negocio antes de crear una reseña",
  inputSchema: {
    type: "object",
    properties: {
      usuario_id: { 
        type: "string",
        description: "UUID del usuario que crea la reseña"
      },
      calificacion: { 
        type: "number",
        description: "Calificación de 1 a 5"
      },
      mensaje: {
        type: "string",
        description: "Contenido de la reseña"
      }
    },
    required: ["usuario_id", "calificacion", "mensaje"]
  },
  execute: async ({ usuario_id, calificacion, mensaje }: { 
    usuario_id: string; 
    calificacion: number; 
    mensaje: string 
  }) => {
    const errores: string[] = [];

    // Validación 1: Calificación debe estar entre 1 y 5
    if (calificacion < 1 || calificacion > 5) {
      errores.push("La calificación debe estar entre 1 y 5");
    }

    // Validación 2: El mensaje no puede estar vacío
    if (!mensaje || mensaje.trim().length === 0) {
      errores.push("El mensaje no puede estar vacío");
    }

    // Validación 3: El mensaje debe tener al menos 10 caracteres
    if (mensaje && mensaje.trim().length < 10) {
      errores.push("El mensaje debe tener al menos 10 caracteres");
    }

    // Validación 4: Verificar formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(usuario_id)) {
      errores.push("El usuario_id debe ser un UUID válido");
    }

    // Retornar resultado de validación
    if (errores.length > 0) {
      return {
        valido: false,
        errores: errores,
        mensaje: "La reseña no cumple con las reglas de negocio"
      };
    }

    return {
      valido: true,
      mensaje: "La reseña cumple con todas las reglas de negocio"
    };
  }
};
