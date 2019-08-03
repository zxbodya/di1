import babel from 'rollup-plugin-babel';
import pkg from './package.json';

export default {
  input: 'src/di.js',
  external: ['@babel/runtime'],
  output: [
    { file: pkg.main, sourcemap: true, format: 'cjs' },
    { file: pkg.module, sourcemap: true, format: 'es' },
  ],
  plugins: [
    babel({
      exclude: ['node_modules/**'],
      runtimeHelpers: true,
    }),
  ],
};
