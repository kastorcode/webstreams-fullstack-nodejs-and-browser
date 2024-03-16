import csvtojson from 'csvtojson'
import { createReadStream, promises } from 'fs'
import { dirname, join } from 'path'
import { Readable, Transform } from 'stream'
import { WritableStream, TransformStream } from 'stream/web'
import StreamConcat from 'stream-concat'
import { setTimeout } from 'timers/promises'


const { pathname } = new URL(import.meta.url)
const __dirname = dirname(pathname)
const dataset = `${__dirname}/dataset`


function handleError (response, error) {
  console.error(error)
  response.writeHead(500)
  response.end()
}


async function getReadStream () {
  const files = await promises.readdir(dataset)
  const streams = files.map(file => createReadStream(join(dataset, file)))
  return Readable.toWeb(new StreamConcat(streams))
}


function getTransformStream (itemsController, count) {
  return new TransformStream({
    async transform (chunk, controller) {
      itemsController.sum()
      if (itemsController.count <= count) return
      await setTimeout(200)
      const data = JSON.parse(Buffer.from(chunk))
      const mappedData = JSON.stringify({
        title: data.title, description: data.description,
        url_anime: data.url_anime, image: data.image
      }).concat('\n')
      controller.enqueue(mappedData)
    }
  })
}


function getWritableStream (response, itemsController) {
  return new WritableStream({
    write (chunk) {
      response.write(chunk)
    },
    close () {
      itemsController.print()
      response.end()
    }
  })
}


async function stream (request, response) {
  const itemsController = {
    count: 0,
    sum () {
      this.count++
    },
    print () {
      console.log(`${this.count} items processed`)
    }
  }
  const readStream = await getReadStream()
  const writableStream = getWritableStream(response, itemsController)
  const abortController = new AbortController()
  request.once('close', () => {
    abortController.abort()
    itemsController.print()
  })
  readStream
    .pipeThrough(Transform.toWeb(csvtojson()), { signal: abortController.signal })
    .pipeThrough(getTransformStream(itemsController, request.count))
    .pipeTo(writableStream)
    .catch(error => error.name !== 'AbortError' && handleError(response, error))
}


export default stream