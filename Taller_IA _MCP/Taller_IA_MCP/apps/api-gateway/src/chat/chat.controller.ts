import { Controller, Post, Get, Body, BadRequestException } from '@nestjs/common';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import fetch from 'node-fetch';

@Controller('chat')
export class ChatController {
  private genAI: GoogleGenerativeAI;
  private readonly MCP_SERVER_URL = 'http://localhost:3001';

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no está configurada');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  @Get('models')
  async listModels() {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
      const response = await fetch(url);
      const data: any = await response.json();
      
      if (!response.ok) {
        return { error: data };
      }

      const compatibleModels = data.models
        ?.filter((m: any) => 
          m.supportedGenerationMethods?.includes('generateContent')
        )
        .map((m: any) => ({
          name: m.name.replace('models/', ''),
          displayName: m.displayName,
          description: m.description,
          methods: m.supportedGenerationMethods,
        }));

      return {
        total: compatibleModels?.length || 0,
        modelos: compatibleModels,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  @Post()
  async chat(@Body() body: { mensaje: string }) {
    console.log('📥 Request body:', body);
    
    if (!body || !body.mensaje) {
      throw new BadRequestException('El campo "mensaje" es requerido');
    }

    try {
      // 1️⃣ Consultar tools disponibles en el MCP Server
      console.log('🔍 Consultando tools del MCP Server...');
      const toolsResponse = await fetch(`${this.MCP_SERVER_URL}/tools`);
      if (!toolsResponse.ok) {
        throw new Error('No se pudo consultar tools del MCP Server');
      }
      const toolsData: any = await toolsResponse.json();
      console.log(`✅ Se encontraron ${toolsData.tools?.length || 0} tools`);

      // 2️⃣ Convertir tools del MCP al formato de Gemini
      const functionDeclarations = toolsData.tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description,
        parameters: {
          type: SchemaType.OBJECT,
          properties: tool.inputSchema.properties,
          required: tool.inputSchema.required || [],
        },
      }));

      // 3️⃣ Crear modelo - USA DIRECTAMENTE gemini-2.5-flash
      console.log('🤖 Inicializando Gemini 2.5 Flash...');
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        tools: [{ functionDeclarations }],
        systemInstruction: `Eres un asistente de un sistema de gestión de usuarios y reseñas turísticas.

Tienes 3 herramientas disponibles:
1. buscar_usuario - Úsala cuando el usuario pida buscar, consultar o verificar un usuario por correo
2. validar_resena - Úsala cuando el usuario pida validar una reseña antes de crearla
3. crear_resena - Úsala cuando el usuario pida crear, registrar o guardar una reseña nueva

IMPORTANTE:
- Si el usuario pide buscar un usuario POR CORREO, usa buscar_usuario
- Si el usuario pide validar datos de una reseña, usa validar_resena
- Si el usuario pide crear una reseña, usa crear_resena
- Para preguntas generales, responde normalmente sin usar herramientas

Ejemplos:
- "Busca el usuario test@gmail.com" → usa buscar_usuario
- "Valida una reseña con calificación 5" → usa validar_resena
- "Crea una reseña de Quito" → usa crear_resena`,
      });

      // 4️⃣ Enviar mensaje a Gemini
      console.log('💬 Enviando mensaje a Gemini...');
      const chat = model.startChat();
      let result = await chat.sendMessage(body.mensaje);
      let response = result.response;

      console.log('🤖 Respuesta inicial:', {
        hasText: !!response.text,
        hasFunctionCalls: !!response.functionCalls,
      });

      // 5️⃣ Verificar si Gemini decidió usar algún tool
      const functionCalls = response.functionCalls?.() || [];

      if (functionCalls.length === 0) {
        console.log('✅ Respuesta directa sin uso de tools');
        return {
          tipo: 'respuesta_directa',
          respuesta: response.text(),
          modelo_usado: 'gemini-2.5-flash',
          tools_utilizadas: [],
        };
      }

      // 6️⃣ Ejecutar los tools que Gemini decidió usar
      console.log(`🔧 Gemini decidió usar ${functionCalls.length} tool(s)`);
      const toolResults: any[] = [];
      const functionResponses: any[] = [];

      for (const functionCall of functionCalls) {
        console.log(`🔧 Ejecutando tool: ${functionCall.name}`);
        console.log(`📋 Parámetros:`, JSON.stringify(functionCall.args, null, 2));

        try {
          const mcpResponse = await fetch(`${this.MCP_SERVER_URL}/mcp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: Date.now(),
              method: functionCall.name,
              params: functionCall.args,
            }),
          });

          if (!mcpResponse.ok) {
            throw new Error(`MCP Server respondió con status ${mcpResponse.status}`);
          }

          const mcpData: any = await mcpResponse.json();
          console.log(`✅ Resultado del tool ${functionCall.name}:`, mcpData);

          if (mcpData.error) {
            throw new Error(mcpData.error.message || 'Error en MCP Server');
          }

          toolResults.push({
            tool: functionCall.name,
            parametros: functionCall.args,
            resultado: mcpData.result,
          });

          functionResponses.push({
            functionResponse: {
              name: functionCall.name,
              response: mcpData.result,
            },
          });
        } catch (error) {
          console.error(`❌ Error ejecutando tool ${functionCall.name}:`, error.message);
          
          toolResults.push({
            tool: functionCall.name,
            parametros: functionCall.args,
            error: error.message,
          });

          functionResponses.push({
            functionResponse: {
              name: functionCall.name,
              response: { 
                error: error.message,
                success: false 
              },
            },
          });
        }
      }

      // 7️⃣ Enviar resultados de vuelta a Gemini
      console.log('🔄 Enviando resultados de tools de vuelta a Gemini...');
      result = await chat.sendMessage(functionResponses);
      response = result.response;

      console.log('🎯 Respuesta final de Gemini:', response.text());

      // 8️⃣ Retornar respuesta consolidada
      return {
        tipo: 'respuesta_con_tools',
        respuesta: response.text(),
        modelo_usado: 'gemini-2.5-flash',
        tools_utilizadas: toolResults,
        mensaje_original: body.mensaje,
      };
    } catch (error) {
      console.error('❌ Error en chat:', error);
      throw new BadRequestException({
        error: 'Error al procesar la solicitud',
        detalle: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });
    }
  }
}