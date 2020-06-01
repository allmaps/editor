import ReconnectingWebSocket from 'reconnecting-websocket'
import * as ShareDB from 'sharedb/lib/client'

export default function connect (serverUrl) {
  const socket = new ReconnectingWebSocket(serverUrl)
  const connection = new ShareDB.Connection(socket)
  return connection
}
