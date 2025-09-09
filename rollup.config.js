import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import copy from 'rollup-plugin-copy';

export default [
  // Background script bundle
  {
    input: 'src/js/background.js',
    output: {
      file: 'dist/background.js',
      format: 'iife',
      name: 'background'
    },
    plugins: [
      nodeResolve(),
      terser(),
      copy({
        targets: [
          { src: 'src/css/*', dest: 'dist/css' },
          { 
            src: 'manifest.json', 
            dest: 'dist/',
            transform: (contents) => {
              const manifest = JSON.parse(contents.toString());
              // Update paths if needed
              return JSON.stringify(manifest, null, 2);
            }
          }
        ]
      })
    ]
  },
  // Content script bundle
  {
    input: 'src/js/content.js',
    output: {
      file: 'dist/content.js',
      format: 'iife',
      name: 'content'
    },
    plugins: [
      nodeResolve(),
      terser()
    ]
  }
];