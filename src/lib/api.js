import { generateChecksum } from '@allmaps/id/browser'

const API_URL = process.env.VUE_APP_API_URL

export function fetchJson(url) {
  return fetch(url).then((response) => response.json())
}

export async function submitIiif(url, type, id, data) {
  const checksum = await generateChecksum(data)

  const apiUrl = `${API_URL}/${type}s/${id}`

  const apiData = {
    url,
    checksum
  }

  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(apiData)
  })

  const responseData = await response.json()
  return responseData
}
