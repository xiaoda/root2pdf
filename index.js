/* Constants */
const pdfSize = {
  width: 210,
  height: 297
}
const pdfOptions = {
  padding: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  }
}
const htmlElement = document.querySelector('.css-17jr04x')
const {jsPDF} = window.jspdf
const doc = new jsPDF()

/* Variables */
let px2mmRatio
let offsetLeft
let offsetTop

/* Core */
window.html2canvas(htmlElement).then(root => {
  console.log('root:', root)
  setPx2mmRatio(root.bounds.width)
  setOffset(htmlElement)
  renderElment(root)
  setTimeout(_ => {
    // doc.save('a4.pdf')
  }, 0)
})

/* Render functions */
function renderElment (element) {
  const {
    bounds, elements, src, styles, textNodes
  } = element
  renderBackgroundColor({...bounds, ...styles})
  renderBorder({...bounds, ...styles})
  renderImage({...bounds, ...styles, src})
  renderText({...bounds, ...styles, textNodes})
  elements.forEach(renderElment)
}

function renderBackgroundColor (properties) {
  const {
    left, top, width, height, backgroundColor
  } = properties
  if (!backgroundColor) return
  const {r, g, b} = color2rgb(backgroundColor)
  doc.setFillColor(r, g, b)
  doc.context2d.fillRect(
    transformLeft(left), transformTop(top),
    transformSize(width), transformSize(height)
  )
}

function renderBorder (properties) {
  const {
    left, top, width, height,
    borderTopColor, borderTopWidth,
    borderLeftColor, borderLeftWidth,
    borderRightColor, borderRightWidth,
    borderBottomColor, borderBottomWidth
  } = properties
  // todo
}

function renderImage (properties) {
  const {
    left, top, width, height, src
  } = properties
  if (!src) return
  // console.log('src:', src)
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

function renderText (properties) {
  const {
    width, textNodes,
    color, fontSize, lineHeight
  } = properties
  if (!textNodes.length) return
  textNodes.forEach(textNode => {
    const {textBounds} = textNode
    const {r, g, b} = color2rgb(color)
    const pxFontSize = fontSize2px(fontSize)
    doc.setTextColor(r, g, b)
    doc.setFontSize(transformSize2pt(pxFontSize))
    textBounds.forEach(textBound => {
      const {text, bounds} = textBound
      const {left, top} = bounds
      doc.text(
        text, transformLeft(left), transformTop(top), {
          baseline: 'top',
        }
      )
    })
  })
}

/* Utility functions */
function setPx2mmRatio (width) {
  const pdfContentWidth = pdfSize.width - (
    pdfOptions.padding.left + pdfOptions.padding.right
  )
  px2mmRatio = pdfContentWidth / width
}

function setOffset (htmlElement) {
  offsetLeft = htmlElement.offsetLeft
  offsetTop = htmlElement.offsetTop
}

function transformLeft (px) {
  const size = transformSize(px - offsetLeft)
  const position = pdfOptions.padding.left + size
  return position
}

function transformTop (px) {
  const size = transformSize(px - offsetTop)
  const position = pdfOptions.padding.top + size
  return position
}

function transformSize (px) {
  const mm = px * px2mmRatio
  return mm
}

function transformSize2pt (px) {
  const mm = transformSize(px)
  const pt = mm * 2.8346456693
  return pt
}

function fontSize2px (fontSize) {
  const {number, unit} = fontSize
  return number
}

function color2rgb (color) {
  let hexColor = color.toString(16)
  if (hexColor.length < 8) {
    const lackLength = 8 - hexColor.length
    hexColor = `${'0'.repeat(lackLength)}${hexColor}`
  }
  const r = parseInt(hexColor.slice(0, 2), 16)
  const g = parseInt(hexColor.slice(2, 4), 16)
  const b = parseInt(hexColor.slice(4, 6), 16)
  const a = parseInt(hexColor.slice(6), 16)
  return {r, g, b}
}
