import querystring from 'querystring'


export function validateCount (request, response) {
  const count = Number(querystring.parse(request.url.slice(2)).count)
  if (typeof count !== 'number' || count < 0 || count > 99999) {
    response.writeHead(400)
    response.end('invalid count parameter')
  }
  request.count = count
}