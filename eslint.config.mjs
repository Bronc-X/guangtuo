import {defineConfig, globalIgnores} from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    '.codex-tmp/**',
    '.next/**',
    'out/**',
    'dist/**',
    'cdk.out/**',
    'coverage/**',
    'artifacts/**',
    'deliverables/**',
    'output/**',
    'tmp/**',
    '.venv-translation/**',
    'services/hunyuan3d/.gpu-venv/**',
    'services/hunyuan3d/.venv/**',
    'services/hunyuan3d/Hunyuan3D-2-*/**',
    'services/hunyuan3d/hf-cache/**',
    'services/hunyuan3d/gradio-cache/**',
    'services/hunyuan3d/studio-output/**',
    'services/triposg/.runtime-venv/**',
    'services/triposg/pretrained_weights/**',
    'services/triposg/source-git/**',
    'next-env.d.ts'
  ])
]);
