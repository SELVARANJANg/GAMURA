const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = [
  [/\bbg-white\b/g, "bg-white dark:bg-zinc-950"],
  [/\bbg-zinc-50\b/g, "bg-zinc-50 dark:bg-zinc-900/50"],
  [/\btext-black\b/g, "text-black dark:text-white"],
  [/\btext-zinc-900\b/g, "text-zinc-900 dark:text-zinc-50"],
  [/\btext-zinc-800\b/g, "text-zinc-800 dark:text-zinc-200"],
  [/\bborder-zinc-100\b/g, "border-zinc-100 dark:border-zinc-800/50"],
  // Buttons
  [/\bbg-black text-white\b/g, "bg-black text-white dark:bg-white dark:text-black"],
  [/\bhover:text-black\b/g, "hover:text-black dark:hover:text-white"],
  [/\bhover:bg-black\b/g, "hover:bg-black dark:hover:bg-white"],
  [/\bborder-black\b/g, "border-black dark:border-white"]
];

for (const [regex, replacement] of replacements) {
    code = code.replace(regex, replacement);
}

// Add the Moon/Sun icon import if missing
if (!code.includes('Moon')) {
    code = code.replace('ArrowRight } from "lucide-react";', 'ArrowRight, Moon, Sun } from "lucide-react";');
}

fs.writeFileSync('src/App.tsx', code);
