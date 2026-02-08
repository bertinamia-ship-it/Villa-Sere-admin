#!/usr/bin/env node

/**
 * Script de auditoría i18n - 100% confiable
 * Encuentra todas las keys usadas en el código y compara con los diccionarios
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..', '..')

const ROOT_DIR = __dirname
const I18N_DIR = join(ROOT_DIR, 'lib/i18n')
const APP_DIR = join(ROOT_DIR, 'app')
const COMPONENTS_DIR = join(ROOT_DIR, 'components')

// Extensions to check
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

// Regex patterns to find t() calls - only static keys
const T_PATTERN = /t\(['"]([^'"]+)['"]\)/g

// Extract all keys from a file - only static keys
function extractKeysFromFile(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const keys = new Set()
  const dynamicKeys = new Set()
  
  // Reset regex
  T_PATTERN.lastIndex = 0
  let match
  
  while ((match = T_PATTERN.exec(content)) !== null) {
    const key = match[1]
    
    // Skip if it looks like a file path or import
    if (key.startsWith('./') || key.startsWith('../') || key.startsWith('@/') || key.includes('/')) {
      continue
    }
    
    // Skip if it's just a dot or empty
    if (key === '.' || key === '' || key.trim() === '') {
      continue
    }
    
    // Skip if it contains template literal syntax
    if (key.includes('${')) {
      dynamicKeys.add(key)
      continue
    }
    
    // Only add keys that look like translation keys
    // Must have at least one dot (module.key) or be a known single-word module
    if (key.includes('.') || ['common', 'errors', 'nav'].includes(key)) {
      keys.add(key)
    }
  }
  
  return { keys, dynamicKeys }
}

// Load dictionary by parsing line by line - simple and reliable
function loadDictionary(filePath) {
  const content = readFileSync(filePath, 'utf-8')
  const keys = new Set()
  
  // Find the main object start
  let startIndex = -1
  
  if (filePath.includes('es.ts')) {
    const match = content.match(/export\s+const\s+es\s*=\s*\{/)
    if (match) {
      startIndex = match.index
    }
  } else if (filePath.includes('en.ts')) {
    const match = content.match(/const\s+enTranslations\s*=\s*\{/)
    if (match) {
      startIndex = match.index
    }
  }
  
  if (startIndex === -1) {
    console.warn(`⚠️  No se encontró el objeto en ${filePath}`)
    return keys
  }
  
  // Parse line by line from the start
  const lines = content.split('\n')
  const pathStack = []
  let inMainObject = false
  let braceCount = 0
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    
    // Check if we're in the main object
    const lineStart = content.substring(0, content.indexOf(line)).length
    if (lineStart >= startIndex && !inMainObject) {
      inMainObject = true
      braceCount = 1
    }
    
    if (!inMainObject) continue
    
    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) {
      continue
    }
    
    // Skip function definitions
    if (trimmed.includes('function ') || trimmed.includes('export function')) {
      continue
    }
    
    // Calculate indentation level (2 spaces = 1 level)
    const indentMatch = line.match(/^(\s*)/)
    const indent = indentMatch ? indentMatch[1].length : 0
    const level = Math.floor(indent / 2)
    
    // Count braces to know when we exit the main object
    const openBraces = (line.match(/\{/g) || []).length
    const closeBraces = (line.match(/\}/g) || []).length
    braceCount += openBraces - closeBraces
    
    if (braceCount <= 0) {
      break // Exited main object
    }
    
    // Match section header: sectionName: {
    const sectionMatch = line.match(/^\s*['"]?([a-zA-Z_][a-zA-Z0-9_]*)['"]?\s*:\s*\{/)
    if (sectionMatch) {
      const key = sectionMatch[1]
      // Skip keywords
      if (!['interface', 'type', 'const', 'let', 'var', 'function', 'async', 'await', 'import', 'export'].includes(key)) {
        // Adjust stack
        while (pathStack.length > level) {
          pathStack.pop()
        }
        pathStack.push(key)
      }
      continue
    }
    
    // Match key: 'value' or key: "value"
    const keyMatch = line.match(/^\s*['"]?([a-zA-Z_][a-zA-Z0-9_]*)['"]?\s*:\s*['"]([^'"]*)['"]/)
    if (keyMatch) {
      const key = keyMatch[1]
      // Skip keywords
      if (!['interface', 'type', 'const', 'let', 'var', 'function', 'async', 'await', 'import', 'export'].includes(key)) {
        // Adjust stack
        while (pathStack.length > level) {
          pathStack.pop()
        }
        const fullKey = pathStack.length > 0 ? [...pathStack, key].join('.') : key
        keys.add(fullKey)
      }
      continue
    }
    
    // Handle closing braces
    if (trimmed === '},' || trimmed === '}') {
      if (pathStack.length > 0) {
        pathStack.pop()
      }
    }
  }
  
  return keys
}

// Recursively find all files
function findFiles(dir, fileList = []) {
  try {
    const files = readdirSync(dir)
    
    for (const file of files) {
      const filePath = join(dir, file)
      const stat = statSync(filePath)
      
      // Skip node_modules, .next, etc.
      if (file.startsWith('.') || file === 'node_modules' || file === '.next' || file === 'dist' || file === 'scripts') {
        continue
      }
      
      if (stat.isDirectory()) {
        findFiles(filePath, fileList)
      } else if (EXTENSIONS.includes(extname(file))) {
        fileList.push(filePath)
      }
    }
  } catch (error) {
    // Skip directories that can't be read
  }
  
  return fileList
}

// Main execution
console.log('🔍 Auditoría i18n - Buscando keys usadas en el código...\n')

// Find all files
const allFiles = [
  ...findFiles(APP_DIR),
  ...findFiles(COMPONENTS_DIR),
]

console.log(`📁 Archivos encontrados: ${allFiles.length}\n`)

// Extract all keys from code
const usedKeys = new Set()
const allDynamicKeys = new Set()

for (const file of allFiles) {
  try {
    const { keys, dynamicKeys } = extractKeysFromFile(file)
    keys.forEach(key => usedKeys.add(key))
    dynamicKeys.forEach(key => allDynamicKeys.add(key))
  } catch (error) {
    // Skip files that can't be read
  }
}

console.log(`🔑 Keys usadas en código: ${usedKeys.size}`)
if (allDynamicKeys.size > 0) {
  console.log(`⚠️  Keys dinámicas encontradas: ${allDynamicKeys.size}`)
}
console.log()

// Load dictionaries
console.log('📚 Cargando diccionarios...')
const esKeys = loadDictionary(join(I18N_DIR, 'es.ts'))
const enKeys = loadDictionary(join(I18N_DIR, 'en.ts'))

console.log(`📚 Keys en es.ts: ${esKeys.size}`)
console.log(`📚 Keys en en.ts: ${enKeys.size}\n`)

// Debug: check if some known keys exist
const testKeys = ['bank.accountDeleted', 'bank.accountName', 'bank.accountSaved', 'settings.language', 'settings.languageDescription']
console.log('🔍 Verificación de keys de prueba:')
for (const key of testKeys) {
  const inEs = esKeys.has(key)
  const inEn = enKeys.has(key)
  console.log(`   ${key}: ES=${inEs ? '✅' : '❌'}, EN=${inEn ? '✅' : '❌'}`)
}
console.log()

// Find missing keys
const missingInEs = []
const missingInEn = []

for (const key of usedKeys) {
  if (!esKeys.has(key)) {
    missingInEs.push(key)
  }
  if (!enKeys.has(key)) {
    missingInEn.push(key)
  }
}

// Sort for easier reading
missingInEs.sort()
missingInEn.sort()

// Generate report
const report = `# Auditoría i18n - Keys Faltantes

**Fecha:** ${new Date().toISOString().split('T')[0]}  
**Objetivo:** Encontrar todas las keys usadas en el código que no existen en los diccionarios

---

## Resumen

- **Keys usadas en código:** ${usedKeys.size}
- **Keys en es.ts:** ${esKeys.size}
- **Keys en en.ts:** ${enKeys.size}
- **Keys dinámicas encontradas:** ${allDynamicKeys.size}

---

## Keys Faltantes en es.ts

**Total:** ${missingInEs.length}

${missingInEs.length > 0 ? missingInEs.map(k => `- \`${k}\``).join('\n') : '✅ **Ninguna - Todas las keys existen**'}

---

## Keys Faltantes en en.ts

**Total:** ${missingInEn.length}

${missingInEn.length > 0 ? missingInEn.map(k => `- \`${k}\``).join('\n') : '✅ **Ninguna - Todas las keys existen**'}

---

## Keys Dinámicas Encontradas

**Total:** ${allDynamicKeys.size}

${allDynamicKeys.size > 0 ? `⚠️  **Se encontraron keys dinámicas que deberían ser revisadas:**\n\n${Array.from(allDynamicKeys).slice(0, 50).map(k => `- \`${k}\``).join('\n')}${allDynamicKeys.size > 50 ? `\n\n... y ${allDynamicKeys.size - 50} más` : ''}` : '✅ **Ninguna**'}

---

## Estado

${missingInEs.length === 0 && missingInEn.length === 0 ? '✅ **PASS** - Todas las keys existen en ambos diccionarios' : '❌ **FAIL** - Hay keys faltantes'}

---

## Notas

- Este reporte se genera automáticamente con \`node scripts/check-i18n-keys.mjs\`
- Las keys dinámicas (con interpolación) no se pueden verificar automáticamente y deberían evitarse
- Re-ejecutar este script después de agregar keys faltantes para verificar
`

// Write report
const reportPath = join(ROOT_DIR, 'docs/I18N_MISSING_KEYS.md')
writeFileSync(reportPath, report, 'utf-8')

// Print summary
console.log('📊 RESULTADOS:\n')
console.log(`❌ Keys faltantes en es.ts: ${missingInEs.length}`)
if (missingInEs.length > 0) {
  const sample = missingInEs.slice(0, 10)
  console.log('   ' + sample.join(', '))
  if (missingInEs.length > 10) console.log(`   ... y ${missingInEs.length - 10} más`)
} else {
  console.log('   ✅ Todas las keys existen')
}

console.log(`\n❌ Keys faltantes en en.ts: ${missingInEn.length}`)
if (missingInEn.length > 0) {
  const sample = missingInEn.slice(0, 10)
  console.log('   ' + sample.join(', '))
  if (missingInEn.length > 10) console.log(`   ... y ${missingInEn.length - 10} más`)
} else {
  console.log('   ✅ Todas las keys existen')
}

if (allDynamicKeys.size > 0) {
  console.log(`\n⚠️  Keys dinámicas encontradas: ${allDynamicKeys.size}`)
  console.log('   (Revisa el reporte para detalles)')
}

console.log(`\n📝 Reporte guardado en: docs/I18N_MISSING_KEYS.md\n`)

if (missingInEs.length === 0 && missingInEn.length === 0) {
  console.log('✅ ¡Perfecto! Todas las keys existen en ambos diccionarios.')
  process.exit(0)
} else {
  console.log('⚠️  Hay keys faltantes. Revisa el reporte y agrégalas a los diccionarios.')
  process.exit(1)
}
