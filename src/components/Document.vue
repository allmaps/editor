<script>
import jsondiff from 'json0-ot-diff'

export default {
  data () {
    return {
      document: undefined
    }
  },
  render: function () {
    return null
  },
  mounted: function () {
    if (this.iiif) {
      this.subscribe()
    }
  },
  beforeDestroy: function () {
    if (this.document) {
      this.document.destroy()
    }
  },
  watch: {
		iiif: function () {
      this.subscribe()
    }
  },
  methods: {
    commit: function (data) {
      if (!this.document) {
        throw new Error('Document not initialized')
      }

      console.log('Committing', data)

      const diff = jsondiff(
        this.document.data || [],
        data
      )

      if (diff.length) {
        console.log('Submitting data')
        try {
          this.document.submitOp(diff)
        } catch (err) {
          if (err.code && err.code === 'ERR_DOC_DOES_NOT_EXIST') {
            this.document.create([])
            this.document.submitOp(diff)
          }
        }
      }
    },
    receivedData: function (op, source) {
      if (source === true) {
        // Operation generated locally, ignore this operation
        return
      }

      const newData = this.document.data || []
      console.log('Received data:', newData)
      if (!this.data) {
        this.data = []
      } else {
        this.data.splice(0)
        this.data.push(...newData)
      }
    },
    subscribe: function () {
      const id = this.iiif.url
      const document = this.connection.get(this.docType, id)

      document.subscribe(this.receivedData)
      document.on('op', this.receivedData)

      this.document = document
    }
  }
}
</script>