import axios from 'axios'

import { createChecksum } from './id'

const API_URL = process.env.VUE_APP_API_URL

export async function submitIiif (url, type, id, data) {
  const checksum = await createChecksum(data)

  const apiUrl = `${API_URL}/${type}s/${id}`

  const apiData = {
    url,
    checksum
  }

  axios.put(apiUrl, apiData)
}
