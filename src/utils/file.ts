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

export const moveFiles = (targetPath: string, files: Array<string>) => {
  const promises = files.map(
    (file) =>
      new Promise(async (resolve, reject) => {
        let newName = await basename(file)
        const jsonPath = `${await dirname(file)}/project.json`
        if (await exists(jsonPath)) {
          const json = await readJson(jsonPath)
          if (json.title && !/[\\\/\:\*\?\"<>\|]+/g.test(json.title)) {
            newName = json.title
          }
        }
        // debugger;
        copyFile(file, `${targetPath}\\${newName}.${await extname(file)}`)
          .then(() => {
            resolve(true)
          })
          .catch(() => {
            reject()
          })
      })
  )

  return Promise.allSettled(promises)
}
