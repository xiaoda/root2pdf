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

/* Initialize */
window.html2canvas(htmlElement).then(root => {
  console.log('root', root)
  setPx2mmRatio(root.bounds.width)
  saveAsPdf(root)
})

/* Core functions */
function saveAsPdf (root) {
  renderElment(root)
  // doc.save('a4.pdf')
}

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

/* Render functions */
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
  // todo
  doc.addImage(
    src, 'SVG',
    transformLeft(left), transformTop(top),
    transformSize(width), transformSize(height)
  )
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
