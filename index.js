/* Constants */
const pdfSize = {
  width: 210,
  height: 297
}
const pdfOptions = {
  padding: {
    top: 5,
    left: 5,
    right: 5,
    bottom: 5
  }
}
const htmlElement = document.querySelector('.css-u69ppf')
const {jsPDF} = window.jspdf
const doc = new jsPDF()

/* Variables */
let px2mmRatio

/* Core */
window.html2canvas(htmlElement).then(root => {
  console.log('root', root)
  setPx2mmRatio(root.bounds.width)
  renderElment(root)
  setTimeout(_ => {
    // doc.save('a4.pdf')
  }, 0)
})

/* Render functions */
function renderElment (element) {
  // console.log('element', element)
  const {
    bounds, elements, src, styles, textNodes
  } = element
  const {backgroundColor} = styles
  renderBackgroundColor({...bounds, backgroundColor})
  renderImage({...bounds, src})
  elements.forEach(renderElment)
}

function renderBackgroundColor (properties) {
  const {
    left, top, width, height, backgroundColor
  } = properties
  if (!backgroundColor) return
  let hexBackgroundColor = backgroundColor.toString(16)
  if (hexBackgroundColor.length < 8) {
    const lackLength = 8 - hexBackgroundColor.length
    hexBackgroundColor = `${' '.repeat(lackLength)}${hexBackgroundColor}`
  }
  const r = parseInt(hexBackgroundColor.slice(0, 2), 16)
  const g = parseInt(hexBackgroundColor.slice(2, 4), 16)
  const b = parseInt(hexBackgroundColor.slice(4, 6), 16)
  doc.setFillColor(r, g, b)
  doc.context2d.fillRect(
    transformLeft(left), transformTop(top),
    transformSize(width), transformSize(height)
  )
}

function renderImage (properties) {
  const {
    left, top, width, height, src
  } = properties
  if (!src) return
  // console.log('src', src)
  const isDataImage = /^data\:image/.test(src)
  if (isDataImage) {
    const [, imageType] = src.match(/^data\:image\/(.+)\;/)
    switch (imageType) {
      case 'jpeg':
      case 'png':
      case 'webp':
        _addImage(src, imageType.toUpperCase())
        break
      case 'svg+xml': {
        const body = document.querySelector('body')
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const image = new Image()
        canvas.style.display = 'none'
        canvas.width = width
        canvas.height = height
        body.appendChild(canvas)
        image.onload = _ => {
          ctx.drawImage(image, 0, 0, width, height)
          _addImage(canvas, 'PNG')
        }
        image.src = src
        break
      }
    }
  } else {}

  function _addImage (imageData, format) {
    doc.addImage(
      imageData, format,
      transformLeft(left), transformTop(top),
      transformSize(width), transformSize(height)
    )
  }
}

/* Utility functions */
function setPx2mmRatio (width) {
  const pdfContentWidth = pdfSize.width - (
    pdfOptions.padding.left + pdfOptions.padding.right
  )
  px2mmRatio = pdfContentWidth / width
}

function transformLeft (px) {
  const size = transformSize(px)
  const position = pdfOptions.padding.left + size
  return position
}

function transformTop (px) {
  const size = transformSize(px)
  const position = pdfOptions.padding.top + size
  return position
}

function transformSize (px) {
  const mm = px * px2mmRatio
  return mm
}
