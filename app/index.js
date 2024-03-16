const API_URL = 'http://192.168.2.81:3000'
const flags = {
  APIisRunning: false,
  cardCount: 0
}
let abortController = new AbortController()
const [startAPI, stopAPI, cards] = ['start', 'stop', 'cards']
  .map(id => document.getElementById(id))


async function consumeAPI (signal) {
  const response = await fetch(`${API_URL}/?count=${flags.cardCount}`, { signal })
  const readable = response.body.pipeThrough(new TextDecoderStream())
    .pipeThrough(parseNDJSON())
    // .pipeTo(new WritableStream({
    //   write (chunk) {
    //     console.log(chunk)
    //   }
    // }))
  return readable
}


function parseNDJSON () {
  let ndjsonBuffer = ''
  return new TransformStream({
    transform (chunk, controller) {
      ndjsonBuffer += chunk
      const items = ndjsonBuffer.split('\n')
      items.slice(0, -1).forEach(item => controller.enqueue(JSON.parse(item)))
      ndjsonBuffer = items[items.length - 1]
    },
    flush (controller) {
      flags.APIisRunning = false
      ndjsonBuffer && controller.enqueue(JSON.parse(ndjsonBuffer))
    }
  })
}


function appendToHTML (element) {
  return new WritableStream({
    write ({ title, description, url_anime, image }) {
      const card = `
        <article>
          <a href="${url_anime}" target="_blank">more info</a>
          <h3>${++flags.cardCount}. ${title}</h3>
          <p>${description}</p>
          <img src="${image}" />
        </article>
      `
      element.innerHTML += card
    }
  })
}


startAPI.addEventListener('click', async () => {
  if (flags.APIisRunning) return
  flags.APIisRunning = true
  const readable = await consumeAPI(abortController.signal)
  readable.pipeTo(appendToHTML(cards))
})


stopAPI.addEventListener('click', () => {
  if (!flags.APIisRunning) return
  flags.APIisRunning = false
  abortController.abort()
  abortController = new AbortController()
})