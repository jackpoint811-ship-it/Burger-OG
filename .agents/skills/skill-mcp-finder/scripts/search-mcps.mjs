#!/usr/bin/env node
/**
 * search-mcps.mjs — Script CLI para consultar Smithery y skills.sh en Burgers.exe
 *
 * Uso:
 *   node .agents/skills/skill-mcp-finder/scripts/search-mcps.mjs <query>
 */

import { execSync } from 'node:child_process';

const query = process.argv[2];

if (!query) {
  console.log('\n🔍 Uso: node .agents/skills/skill-mcp-finder/scripts/search-mcps.mjs <termino-de-busqueda>');
  console.log('   Ejemplo: node .agents/skills/skill-mcp-finder/scripts/search-mcps.mjs cloudflare\n');
  process.exit(1);
}

console.log(`\n======================================================`);
console.log(`🔎 Burgers.exe — Buscando MCPs y Skills para: "${query}"`);
console.log(`======================================================\n`);

try {
  console.log(`📦 [1/2] Consultando Smithery MCP Registry...`);
  const smitheryOutput = execSync(`npx -y @smithery/cli search "${query}"`, { encoding: 'utf-8', timeout: 30000 });
  console.log(smitheryOutput || 'No se encontraron resultados en Smithery.\n');
} catch (err) {
  console.log(`⚠️ No se pudo consultar Smithery CLI.`);
}

try {
  console.log(`\n⚡ [2/2] Consultando skills.sh Registry...`);
  const skillsOutput = execSync(`npx skills search "${query}"`, { encoding: 'utf-8', timeout: 30000 });
  console.log(skillsOutput || 'No se encontraron resultados en skills.sh.\n');
} catch (err) {
  console.log(`⚠️ No se pudo consultar skills.sh CLI.`);
}

console.log(`\n💡 Para instalar un MCP encontrado:`);
console.log(`   npx -y @smithery/cli install <mcp-name> --client antigravity\n`);
