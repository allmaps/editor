# IIIF & Maps

Prototype Vue app, running on [bertspaan.nl/iiifmaps](https://bertspaan.nl/iiifmaps/).

TODO:

- Naam -> Allmaps
- Vue 3.0
- Vuex:
  - https://www.npmjs.com/package/undo-redo-vuex
  - en persist in localstorage
- ook editen van de JSON-anno
  - met https://github.com/acornjs/acorn
  - zie https://astexplorer.net/
- https://www.w3.org/TR/annotation-model/#sets-of-bodies-and-targets
- hoe kun je annotatie toevoegen in manifest zelf?
- moet je annoteren op image, canvas of manifest
  - ik denk image

https://stephenwf.github.io/ocean-liners.json
https://iiif.io/api/presentation/3.0/#annotations

https://ericayhayes.github.io/audubon/exhibits/
https://ericayhayes.github.io/annotateiiif/annotations/obj1-list.json



- hier knop om annotatie te kopiëren, en je moet ook kunnen plakken. En dan op andere plek heel simpele server, waar je kan opslaan, en kan zoeken op ID, en geo?!?!



intermediary json format? with JSON Schema!

image:
  - script: iiif tiles to image

tiles:
  - script: image to iiif tiles!
  - script: image to map tiles!

Ontbrekende dingen:
- script dat van IIIF de complete afbeelding pakt. (is er een source-ding in IIIF om bv. tiff te pakken?)
- Script om tiles te maken, en geotiff. met masker.
- en voorbeeld van manifest met collection, en dat dan naar geotiff van alles!!!!

