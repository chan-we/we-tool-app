import { basename, dirname, extname } from '@tauri-apps/api/path'
import { copyFile, exists, createDir, readTextFile } from '@tauri-apps/api/fs'

const mkdirsSync = async (name: string) => {
  if (await exists(name)) {
    return true
  } else {
    if (await mkdirsSync(await dirname(name))) {
      await createDir(name)
      return true
    }
  }
}

const readJson = async (path: string) => {
  const data = await readTextFile(path)
  return JSON.parse(data)
}

export const moveFiles = async (targetPath: string, files: Array<string>) => {
  if (await exists(targetPath)) {
    console.log(`${targetPath}存在`)
  } else {
    mkdirsSync(targetPath)
    console.log(`${targetPath}不存在，已新建`)
  }

  let count = 0
  files.forEach(async (file) => {
    let newName = await basename(file)
    const jsonPath = `${await dirname(file)}/project.json`
    if (await exists(jsonPath)) {
      const json = await readJson(jsonPath)
      if (json.title && !/[\\\/\:\*\?\"<>\|]+/g.test(json.title)) {
        newName = json.title
      }
    }
    copyFile(file, `${targetPath}\\${newName}${await extname(file)}`)
  })
}
