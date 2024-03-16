const fs = window.__TAURI__.fs
const pathFn = window.__TAURI__.path

// const readline = window.require('readline').createInterface({
//   input: process.stdin,
//   output: process.stdout,
// })

const isVideo = (name: string) =>
  /\.(swf|flv|mp4|rmvb|avi|mpeg|ra|ram|mov|wmv)$/i.test(name.toLowerCase())
const isAudio = (name: string) =>
  /\.(mp3|wav|wma|ogg|ape|acc)$/i.test(name.toLowerCase())
const isImage = (name: string) =>
  /\.(gif|jpg|jpeg|bmp|png)$/i.test(name.toLowerCase())
type FileType = 'video' | 'audio' | 'image'

// export const getDirPath = () => {
//   return new Promise((res, rej) => {
//     readline.question('输入文件夹路径：', (path: string) => {
//       console.log(`正在读取 "${path}" ...`)
//       const isExists = fs.existsSync(path)
//       if (!isExists) {
//         console.error('文件夹不存在')
//         res(null)
//         readline.close()
//       }

//       res(path)
//       readline.close()
//     })
//   })
// }

const readIgnore = (path: string): Array<string> => {
  const data = fs.readFileSync(path, 'utf-8')
  const lines = data.split(/\r?\n/).map((i) => i.trim())
  return lines
}

export const readDir = (
  path: string,
  opt?: { depth?: number; fileType?: Array<FileType> }
) => {
  //   const depth = opt?.depth || 0
  const ignorePath = `${path}\\.weignore`
  let ignoreArr = [] as string[]
  if (fs.existsSync(ignorePath)) {
    ignoreArr = readIgnore(ignorePath)
  }
  console.log(
    ignoreArr.includes(
      'The Witcher 3- Blood and Wine Main Menu巫师3血与酒主菜单by：SheepLoveU.mp4'
    )
  )

  const stack = [path] as any
  let res = [] as any
  while (stack.length > 0) {
    const currentPath = stack.shift()
    const items = fs.readdirSync(currentPath)
    let newItems = items.map((i: string) => {
      const fullpath = `${currentPath}\\${i}`
      if (fs.statSync(fullpath).isDirectory()) {
        stack.push(fullpath)
      }
      return fullpath
    })

    if (opt?.fileType && opt?.fileType.length > 0) {
      const type = opt?.fileType
      newItems = newItems.filter(
        (i) =>
          !ignoreArr.includes(pathFn.basename(i)) &&
          ((type.includes('video') && isVideo(i)) ||
            (type.includes('audio') && isAudio(i)) ||
            (type.includes('image') && isImage(i)))
      )
    }

    res = res.concat(newItems)
  }
  return res
}

const mkdirsSync = (dirname: string) => {
  if (fs.existsSync(dirname)) {
    return true
  } else {
    if (mkdirsSync(pathFn.dirname(dirname))) {
      fs.mkdirSync(dirname)
      return true
    }
  }
}

export const copyFile = (src: string, dist: string, onFinish?: any) => {
  fs.createReadStream(src)
    .pipe(fs.createWriteStream(dist))
    .on('finish', onFinish)
}

const readJson = (path: string) => {
  const data = fs.readFileSync(path, 'utf-8')
  return JSON.parse(data)
}

export const moveFiles = (targetPath: string, files: Array<string>) => {
  if (fs.existsSync(targetPath)) {
    console.log(`${targetPath}存在`)
  } else {
    mkdirsSync(targetPath)
    console.log(`${targetPath}不存在，已新建`)
  }

  let count = 0
  files.forEach((file) => {
    // console.log(pathFn.basename(file))
    let newName = pathFn.basename(file)
    const jsonPath = `${pathFn.dirname(file)}/project.json`
    if (fs.existsSync(jsonPath)) {
      const json = readJson(jsonPath)
      if (json.title && !/[\\\/\:\*\?\"<>\|]+/g.test(json.title)) {
        newName = json.title
      }
    }
    copyFile(file, `${targetPath}\\${newName}${pathFn.extname(file)}`, () => {
      console.log(`已完成：${++count}/${files.length}`)
      if (count === files.length) {
        console.log('移动完成')
      }
    })
  })
}