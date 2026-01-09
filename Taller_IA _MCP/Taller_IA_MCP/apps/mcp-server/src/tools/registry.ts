// src/tools/registry.ts
import { buscarUsuarioTool } from "./buscar-usuario.tool";
import { validarResenaTool } from "./validar-resena.tool";
import { crearResenaTool } from "./crear-resena.tool";

export const tools = [
  buscarUsuarioTool,   // Tool 1: Búsqueda
  validarResenaTool,   // Tool 2: Validación
  crearResenaTool      // Tool 3: Acción transaccional
];
