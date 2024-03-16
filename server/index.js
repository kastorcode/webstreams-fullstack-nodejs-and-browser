import { createServer } from 'http'

import { validateCount } from './helper'
import stream from './stream'


const PORT = 3000


createServer(async (request, response) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*'
  }
  if (request.method === 'OPTIONS') {
    response.writeHead(204, headers)
    response.end()
    return
  }
  response.writeHead(200, headers)
  validateCount(request, response)
  await stream(request, response)
})
.listen(PORT)
.on('listening', () => console.log(`server is running at ${PORT}`))