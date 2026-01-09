// Tool 1: Búsqueda de usuarios (Entidad principal/Maestro)
export const buscarUsuarioTool = {
  name: "buscar_usuario",
  description: "Busca usuarios por correo electrónico en la base de datos",
  inputSchema: {
    type: "object",
    properties: {
      correo: { 
        type: "string",
        description: "Correo electrónico del usuario a buscar"
      }
    },
    required: ["correo"]
  },
  execute: async ({ correo }: { correo: string }) => {
    try {
      // Llamada al microservicio ms-usuario
      const res = await fetch(`http://localhost:3003/usuarios/buscar?correo=${correo}`);
      
      if (!res.ok) {
        return { 
          success: false, 
          error: `Error al buscar usuario: ${res.status}` 
        };
      }
      
      const usuario = await res.json();
      return { 
        success: true, 
        data: usuario 
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: `Error de conexión: ${error.message}` 
      };
    }
  }
};
