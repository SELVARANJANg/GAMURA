import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Just basic test for now
writeFileSync('eslint-test.ts', `
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
console.log("Firebase rules loaded for testing.")
`);
