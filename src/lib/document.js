import jsondiff from 'json0-ot-diff'

export default function (connection, docType, id, updated) {
  let document
  let data

  function commit (data) {
    if (!document) {
      throw new Error('Document not initialized')
    }

    const diff = jsondiff(
      document.data || [],
      data
    )

    if (diff.length) {
      try {
        document.submitOp(diff)
      } catch (err) {
        if (err.code && err.code === 'ERR_DOC_DOES_NOT_EXIST') {
          document.create([])
          document.submitOp(diff)
        }
      }
    }
  }

  function receivedData (op, source) {
    const newData = document.data || []
    if (!data) {
      data = []
    }

    data.splice(0)
    data.push(...newData)

    if (updated) {
      updated(data, source)
    }
  }

  function subscribe () {
    document = connection.get(docType, id)

    document.subscribe(receivedData)
    document.on('op', receivedData)
  }

  function destroy () {
    if (document) {
      document.destroy()
    }
  }

  subscribe()

  return {
    commit,
    destroy
  }
}
