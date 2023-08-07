import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const homedir = os.homedir();

const foundDirs = [];

async function searchDir(dirPath: string, searchName: string) {

  let children;
  try {
    children = await fs.readdir(dirPath);
  } catch (e) {
    return;
  }

  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    const childPath = path.join(dirPath, child);
    const res = await fs.lstat(childPath);

    if (await res.isSymbolicLink()) {
      break;
    }

    if (res.isDirectory() && !child.startsWith('.')) {
      if (child === 'node_modules') {
        foundDirs.push(childPath);
        const size = await dirSize(childPath);
        console.log('路径：', childPath, '大小:', size);
      } else {
        await searchDir(childPath, searchName);
      }
    }
  }
}

async function dirSize(dirPath) {
  let totalSize = 0;

  let children;
  try {
    children = await fs.readdir(dirPath);
  } catch (e) {
    return;
  }

  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    const childPath = path.join(dirPath, child);
    const res = await fs.lstat(childPath);

    if (await res.isSymbolicLink()) {
      break;
    }

    if (res.isDirectory()) {
      totalSize += await dirSize(childPath);
    } else {
      totalSize += res.size;
    }
  }
  return totalSize;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (e) {
    return false;
  }
}
async function removeFileOrDir(dirs: string[]) {
  for (let i = 0; i < dirs.length; i++) {

    if (await fileExists(dirs[i])) {
      await fs.rm(dirs[i], { recursive: true });
      console.log(dirs[i], '完成删除');
    }
  }
}

async function main() {
  await searchDir(homedir, 'node_modules');
  await fs.writeFile('./found', foundDirs.join(os.EOL));
  console.log('----已完成扫描----');
  const str = await fs.readFile('./found', { encoding: 'utf-8' });
  const dirs = str.split(os.EOL);

  await removeFileOrDir(dirs);
}

main();