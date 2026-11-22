import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'src/**/*', 'public/**/*', 'api/**/*', '**/*.ts', '**/*.tsx', '**/*.js', '**/*.cjs'],
  },
  firebaseRulesPlugin.configs['flat/recommended'],
];
