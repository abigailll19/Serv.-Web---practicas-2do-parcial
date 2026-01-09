// src/server.ts
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { tools } from "./tools/registry";

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Endpoint principal MCP - JSON-RPC 2.0
app.post("/mcp", async (req, res) => {
  console.log("📥 Request recibida:", req.body);
  
  const { jsonrpc, id, method, params } = req.body;
  
  console.log("🔍 Valores extraídos:", { jsonrpc, id, method, params });

  // Validar formato JSON-RPC 2.0
  if (jsonrpc !== "2.0") {
    return res.json({
      jsonrpc: "2.0",
      id: id || null,
      error: {
        code: -32600,
        message: "Invalid Request: jsonrpc debe ser '2.0'"
      }
    });
  }

  // Buscar el tool
  const tool = tools.find(t => t.name === method);
  if (!tool) {
    return res.json({
      jsonrpc: "2.0",
      id: id || null,
      error: {
        code: -32601,
        message: `Method not found: ${method}`
      }
    });
  }

  try {
    // Ejecutar el tool
    const result = await tool.execute(params);
    
    res.json({
      jsonrpc: "2.0",
      id: id || null,
      result: result
    });
  } catch (error: any) {
    res.json({
      jsonrpc: "2.0",
      id: id || null,
      error: {
        code: -32603,
        message: "Internal error",
        data: error.message
      }
    });
  }
});

// Endpoint para listar tools disponibles
app.get("/tools", (req, res) => {
  res.json({
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    }))
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", tools: tools.length });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log("🧠 MCP Server corriendo en puerto", PORT);
  console.log("📋 Tools disponibles:");
  tools.forEach(t => console.log(`   - ${t.name}: ${t.description}`));
});
