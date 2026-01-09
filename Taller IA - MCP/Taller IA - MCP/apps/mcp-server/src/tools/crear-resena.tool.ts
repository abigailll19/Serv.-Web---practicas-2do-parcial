// Tool 3: Acción transaccional - Crear reseña
export const crearResenaTool = {
  name: "crear_resena",
  description: "Ejecuta la operación transaccional de crear una nueva reseña",
  inputSchema: {
    type: "object",
    properties: {
      autor: { 
        type: "string",
        description: "Nombre del autor de la reseña"
      },
      destino: { 
        type: "string",
        description: "Lugar o destino reseñado"
      },
      mensaje: {
        type: "string",
        description: "Contenido de la reseña"
      },
      calificacion: {
        type: "number",
        description: "Calificación de 1 a 5"
      },
      usuario_id: {
        type: "string",
        description: "UUID del usuario que crea la reseña"
      }
    },
    required: ["autor", "destino", "mensaje", "calificacion", "usuario_id"]
  },
  execute: async ({ autor, destino, mensaje, calificacion, usuario_id }: {
    autor: string;
    destino: string;
    mensaje: string;
    calificacion: number;
    usuario_id: string;
  }) => {
    try {
      // Llamada directa a ms-resena (Puerto 3004)
      const res = await fetch('http://localhost:3004/resenas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          autor,
          destino,
          mensaje,
          calificacion,
          usuario_id
        })
      });

      if (!res.ok) {
        return {
          success: false,
          error: `Error al crear reseña: ${res.status}`,
          status: res.status
        };
      }

      const result = await res.json();
      
      return {
        success: true,
        data: result,
        mensaje: "Reseña creada exitosamente"
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Error de conexión al crear reseña: ${error.message}`
      };
    }
  }
};
