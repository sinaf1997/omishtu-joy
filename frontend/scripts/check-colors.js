#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target frontend/src directory, excluding index.css
const targetDir = path.resolve(__dirname, '../src');

function walkDir(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walkDir(fullPath));
    } else if (
      (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) &&
      !entry.name.endsWith('.d.ts')
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

// Patterns forbidden in components (must use semantic tokens instead)
const FORBIDDEN_PATTERNS = [
  {
    name: 'Hardcoded Hex Color',
    regex: /#[0-9a-fA-F]{3,8}\b/g,
  },
  {
    name: 'Hardcoded RGB/HSL literal',
    regex: /\b(?:rgb|hsl)a?\([^)]+\)/g,
  },
  {
    name: 'Literal bg-white / text-black / text-white',
    regex: /\b(?:bg-white|text-black|text-white)\b/g,
  },
  {
    name: 'Hardcoded Tailwind standard palette color (use semantic tokens)',
    regex: /\b(?:bg|text|border|ring|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950)\b/g,
  },
];

const files = walkDir(targetDir);
const violations = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip comments if desired, or check all lines
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      return;
    }

    for (const pattern of FORBIDDEN_PATTERNS) {
      const matches = trimmed.match(pattern.regex);
      if (matches) {
        violations.push({
          file: path.relative(path.resolve(__dirname, '../..'), file),
          line: index + 1,
          matches: Array.from(new Set(matches)),
          rule: pattern.name,
          snippet: trimmed,
        });
      }
    }
  });
}

if (violations.length > 0) {
  console.error('\n❌ Theme token check failed! Found forbidden hardcoded colors:\n');
  violations.forEach((v) => {
    console.error(`  ${v.file}:${v.line}`);
    console.error(`    Rule: ${v.rule}`);
    console.error(`    Offenders: ${v.matches.join(', ')}`);
    console.error(`    Line: ${v.snippet}\n`);
  });
  console.error(`Total violations: ${violations.length}`);
  console.error('Use semantic tokens instead: bg-background, bg-card, text-foreground, text-muted-foreground, border-border, bg-secondary, bg-primary, etc.\n');
  process.exit(1);
} else {
  console.log(`\n✓ All ${files.length} source files strictly adhere to theme tokens! No hardcoded colors found.\n`);
  process.exit(0);
}
