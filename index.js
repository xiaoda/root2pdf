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
const instantExport = 1
const htmlElement = document.querySelector('.css-17jr04x')
const {jsPDF} = window.jspdf
const doc = new jsPDF()

/* Variables */
let px2mmRatio
let offsetLeft
let offsetTop
let pressedKeys = []
let textRenderingQueue = []

/* Core */
if (instantExport) exportPdf()
else {
  window.addEventListener('keydown', event => {
    const {key} = event
    if (!pressedKeys.includes(key)) {
      pressedKeys.push(key)
    }
    if (
      pressedKeys.includes('p') &&
      pressedKeys.includes('d') &&
      pressedKeys.includes('f')
    ) exportPdf()
  })
  window.addEventListener('keyup', event => {
    const {key} = event
    if (pressedKeys.includes(key)) {
      const index = pressedKeys.indexOf(key)
      pressedKeys.splice(index, 1)
    }
  })
}

function exportPdf () {
  window.html2canvas(htmlElement).then(root => {
    console.log('ROOT >>>', root)
    setPx2mmRatio(root.bounds.width)
    setOffset(htmlElement)
    renderElment(root)
    renderAllText()
    setTimeout(_ => {
      doc.save('a4.pdf')
    }, 0)
  })
}

/* Render functions */
function renderElment (element) {
  const {
    bounds, elements, src, styles, textNodes
  } = element
  renderBackgroundColor({...bounds, ...styles})
  renderBorder({...bounds, ...styles})
  renderImage({...bounds, ...styles, src})
  prepareTextRendering({...styles, textNodes})
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
    borderTopWidth, borderTopColor,
    borderLeftWidth, borderLeftColor,
    borderRightWidth, borderRightColor,
    borderBottomWidth, borderBottomColor
  } = properties
  if (borderTopWidth) {
    const {r, g, b} = color2rgb(borderTopColor)
    doc.setFillColor(r, g, b)
    doc.context2d.fillRect(
      transformLeft(left),
      transformTop(top),
      transformSize(width),
      transformSize(borderTopWidth)
    )
  }
  if (borderLeftWidth) {
    const {r, g, b} = color2rgb(borderLeftColor)
    doc.setFillColor(r, g, b)
    doc.context2d.fillRect(
      transformLeft(left),
      transformTop(top),
      transformSize(borderLeftWidth),
      transformSize(height)
    )
  }
  if (borderRightWidth) {
    const {r, g, b} = color2rgb(borderRightColor)
    doc.setFillColor(r, g, b)
    doc.context2d.fillRect(
      transformLeft(left + width - borderRightWidth),
      transformTop(top),
      transformSize(borderRightWidth),
      transformSize(height)
    )
  }
  if (borderBottomWidth) {
    const {r, g, b} = color2rgb(borderBottomColor)
    doc.setFillColor(r, g, b)
    doc.context2d.fillRect(
      transformLeft(left),
      transformTop(top + height - borderBottomWidth),
      transformSize(width),
      transformSize(borderBottomWidth)
    )
  }
}

function renderImage (properties) {
  const {
    left, top, width, height, src
  } = properties
  if (!src) return

  const isWebImage = /^https?:\/\//.test(src)
  const isDataImage = /^data\:image\//.test(src)
  let imageType
  if (isWebImage) {
    const matchResult = src.match(/[^.]+$/)
    imageType = matchResult[0]
  } else if (isDataImage) {
    const matchResult = src.match(/^data\:image\/(.+)\;/)
    imageType = matchResult[1]
    switch (imageType) {
      case 'svg+xml':
        imageType = 'png'
        break
    }
  }

  const canvas = document.createElement('canvas')
  canvas.style.display = 'none'
  canvas.width = width
  canvas.height = height

  const body = document.querySelector('body')
  body.appendChild(canvas)

  const image = new Image()
  image.crossOrigin = 'Anonymous'
  image.onload = _ => {
    const ctx = canvas.getContext('2d')
    ctx.drawImage(image, 0, 0, width, height)
    doc.addImage(
      canvas, imageType.toUpperCase(),
      transformLeft(left), transformTop(top),
      transformSize(width), transformSize(height)
    )
  }
  image.src = src
}

function prepareTextRendering (properties) {
  const {
    textNodes, color,
    fontSize, fontStyle, fontWeight
  } = properties
  if (!textNodes.length) return
  const {r, g, b} = color2rgb(color)
  const pxFontSize = fontSize2px(fontSize)
  textNodes.forEach(textNode => {
    const {text, textBounds} = textNode
    const {left, top} = textBounds[0].bounds
    const textRenderingItem = {
      text, textBounds, left, top,
      fontStyle, fontWeight,
      color: {r, g, b},
      fontSize: pxFontSize
    }
    textRenderingQueue.push(textRenderingItem)
  })
}

function renderAllText () {
  const sortedQueue = textRenderingQueue.sort((a, b) => {
    const condition = (
      _almostSameTop(a.top, b.top, a.fontSize, b.fontSize) ?
      a.left - b.left :
      a.top - b.top
    )
    return condition
  })
  sortedQueue.forEach(queueItem => {
    const {
      color, textBounds,
      fontSize, fontStyle, fontWeight
    } = queueItem
    const {r, g, b} = color
    doc.setFont('Helvetica', fontStyle, fontWeight)
    doc.setFontSize(transformSize2pt(fontSize))
    doc.setTextColor(r, g, b)
    textBounds.forEach(textBound => {
      const {text, bounds} = textBound
      const {left, top, width, height} = bounds
      const x = left + width / 2
      doc.text(
        text, transformLeft(x), transformTop(top), {
          align: 'center',
          baseline: 'top'
        }
      )
    })
  })

  function _almostSameTop (top1, top2, fontSize1, fontSize2) {
    return Math.abs(top1 - top2) < (fontSize1 + fontSize2) / 2 / 2
  }
}

/* Size utility functions */
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

/* Color utility functions */
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
