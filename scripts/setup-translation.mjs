import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';

const project = process.cwd();
const environment = path.join(project, '.venv-translation');
const python = path.join(environment, process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
function run(command, args) {
  const result = spawnSync(command, args, {stdio: 'inherit', windowsHide: true});
  if (result.error || result.status !== 0) throw new Error(`Translation setup failed: ${command}`);
}
if (!existsSync(python)) run(process.env.PYTHON ?? (process.platform === 'win32' ? 'python' : 'python3'), ['-m', 'venv', environment]);
run(python, ['-m', 'pip', 'install', '--no-deps', '-r', path.join(project, 'services/translation/requirements.txt')]);
run(python, [path.join(project, 'services/translation/setup.py')]);
