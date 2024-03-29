const style = document.createElement('style')
const fadeOutTime = 1750
let zoomMode = 0 // 0 = 1x, 1 = 2x, 2 = fill
let mainButtons = null
let imagineTextarea = null
style.textContent = `
:root { --zoom-margin-size: 0; }
.zoom-overlay::-webkit-scrollbar { display: none; }
.zoom-overlay {
 position: fixed;
 cursor: move;
 top: var(--zoom-margin-size);
 right: var(--zoom-margin-size);
 bottom: var(--zoom-margin-size);
 left: var(--zoom-margin-size);
 overflow: auto;
 z-index: 1000;
 display: table-cell!important;
 vertical-align: middle;
 text-align: center;
 background-color:#333;
}
.zoom-overlay img {
 display: inline-block;
 font-size:0;
 line-height:0;
 box-shadow: 0 0.75rem 2rem rgba(0,0,0,0.4);
}
.zoom-overlay::after {
 font-family: DM Sans,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif;
 content: attr(data-zoominfo);
 position: fixed;
 bottom: -2.25rem;
 left: 50%;
 transform:translate(-50%,0);
 background: rgba(0, 0, 0, 0.7);
 color: rgba(255,255,255,0.88);
 padding: 0.25rem 0.75rem;
 border-radius: 100px;
 opacity: 0;
 font-weight:bolder;
 font-size:0.78rem;
 transition: opacity ${(fadeOutTime / 1000) * 0.5}s ease-in-out, transform ${(fadeOutTime / 1000) * 0.375}s ease-in-out;
 z-index:1001;
}

.zoom-overlay.show-info::after {
 left: 50%;
 transform:translate(-50%,-3rem);
 opacity: 1;
}
`
document.head.appendChild(style)

function createZoomOverlay(img, initialZoomFactor) {
  const zoomedImg = document.createElement('img')
  zoomedImg.src = img.src
  zoomedImg.id = 'zoomedImg'
  let zoomFactor = initialZoomFactor
  const zoomOverlay = document.createElement('div')
  zoomOverlay.classList.add('zoom-overlay')

  let fadeOutTimeout // Declare this at the top of your script

  function updateZoom() {
    zoomedImg.style.width = `${img.naturalWidth * zoomFactor}px`
    zoomedImg.style.height = `${img.naturalHeight * zoomFactor}px`
    zoomedImg.style.minWidth = `${img.naturalWidth * zoomFactor}px`
    zoomedImg.style.minHeight = `${img.naturalHeight * zoomFactor}px`
    setPadding()
    let zoomInfo = `Zoom: ${zoomFactor}X  |  Image: ${img.naturalWidth}px × ${img.naturalHeight}px`
    if (zoomMode === 2) {
      zoomInfo = `Zoom: ${zoomFactor.toFixed(2)}X (Fill)  |  Image: ${img.naturalWidth}px × ${img.naturalHeight}px`
    }
    zoomOverlay.setAttribute('data-zoominfo', zoomInfo)
    zoomOverlay.classList.add('show-info')
    clearTimeout(fadeOutTimeout)
    fadeOutTimeout = setTimeout(() => {
      zoomOverlay.classList.remove('show-info')
    }, fadeOutTime)
  }

  function setPadding() {
    const imgRect = zoomedImg.getBoundingClientRect()
    const overlayRect = zoomOverlay.getBoundingClientRect()

    if (imgRect.height < overlayRect.height) {
      const padding = (overlayRect.height - imgRect.height) / 2
      zoomOverlay.style.paddingTop = `${padding}px`
      zoomOverlay.style.paddingBottom = `${padding}px`
    } else {
      zoomOverlay.style.paddingTop = '0'
      zoomOverlay.style.paddingBottom = '0'
    }
  }

  function handleKeyDown(event) {
    const keyActionMap = {
      'Ctrl+Shift+Meta': () => {
        zoomFactor = calculateViewportZoomFactor(img)
        zoomMode = 2
        updateZoom()
      },
      'Shift+Meta': () => {
        zoomFactor = 2
        zoomMode = 1
        updateZoom()
      },
      Meta: () => {
        zoomFactor = 1
        zoomMode = 0
        updateZoom()
      }
    }

    // Build the key combination string based on the pressed keys
    const combination = [event.ctrlKey ? 'Ctrl' : '', event.shiftKey ? 'Shift' : '', event.metaKey ? 'Meta' : '', event.key.toUpperCase()].filter(Boolean).join('+')

    // Execute the action associated with the key combination, if it exists
    const action = keyActionMap[combination]
    if (action) {
      action()
    }
  }

  function handleKeyUp(event) {
    if (event.key === 'Control' && event.shiftKey && event.metaKey) {
      zoomFactor = 2
      zoomMode = 1
    } else if (event.key === 'Shift' && event.metaKey) {
      zoomFactor = 1
      zoomMode = 0
    } else if (event.key === 'Meta') {
      zoomFactor = 1
      zoomMode = 0
    }
    updateZoom()
  }
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)

  const createZoomOverlay = () => {
    zoomOverlay.appendChild(zoomedImg)
    document.body.appendChild(zoomOverlay)

    let mouseMoveHandler

    function updateMouseMoveHandler() {
      if (mouseMoveHandler) {
        document.removeEventListener('mousemove', mouseMoveHandler)
      }

      mouseMoveHandler = function (event) {
        // return // short-circuits to enable inspection
        const zoomOverlayRect = zoomOverlay.getBoundingClientRect()
        const xPercentage = ((event.clientX - zoomOverlayRect.left) / zoomOverlayRect.width) * 100
        const yPercentage = ((event.clientY - zoomOverlayRect.top) / zoomOverlayRect.height) * 100

        zoomOverlay.scrollLeft = (zoomOverlay.scrollWidth - zoomOverlay.clientWidth) * (xPercentage / 100)
        zoomOverlay.scrollTop = (zoomOverlay.scrollHeight - zoomOverlay.clientHeight) * (yPercentage / 100)
      }
      document.addEventListener('mousemove', mouseMoveHandler)
    }

    updateMouseMoveHandler()

    document.addEventListener(
      'mouseup',
      function () {
        // return // short-circuits to enable inspection
        document.removeEventListener('keydown', handleKeyDown)
        document.removeEventListener('keyup', handleKeyUp)
        document.body.removeChild(zoomOverlay)
      },
      { once: true }
    )
  }

  if (img.complete) {
    updateZoom()
    createZoomOverlay(zoomedImg)
    setPadding()
  } else {
    zoomedImg.onload = function () {
      updateZoom()
      createZoomOverlay(this)
      setPadding()
    }
  }
}

document.addEventListener('contextmenu', function (event) {
  if (event.ctrlKey && event.target.tagName === 'IMG') {
    event.preventDefault()
  }
})

function zoomImage(event) {
  if (event.shiftKey && event.target.tagName === 'IMG') {
    event.preventDefault()
    createZoomOverlay(event.target, event.shiftKey ? 2 : 1)
  }
}
function calculateViewportZoomFactor(img) {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight
  const widthRatio = viewportWidth / img.naturalWidth
  const heightRatio = viewportHeight / img.naturalHeight
  return Math.max(widthRatio, heightRatio)
}

document.addEventListener('mousedown', zoomImage)

function handleNumberKeyDown(event) {
  switch (event.key) {
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
      if (event.metaKey) {
        doNumberClick(event)
      }
      break
  }
}
function doNumberClick(event) {
  if (!mainButtons) {
    mainButtons = document.querySelectorAll('a.rounded-full')
    if (!mainButtons.length) {
      console.log('mainButtons not found')
      return
    }
  }

  // MAIN APP BUTTONS
  switch (event.key) {
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
      if (event.metaKey) {
        event.preventDefault()
        mainButtons[parseInt(event.key, 10) - 1].click()
      }
      break
  }
}
document.addEventListener('keydown', handleNumberKeyDown)

// JUMP TO IMAGINE TEXTAREA
function jumpToImagine() {
  if (!imagineTextarea) {
    imagineTextarea = document.querySelector('textarea[placeholder="Imagine..."]')
    if (!imagineTextarea) {
      console.log('imagineTextarea not found')
      return
    }
  }
  imagineTextarea.focus()
}

document.addEventListener('keydown', function (event) {
  if (event.altKey && event.key === 'Tab') {
    event.preventDefault()
    jumpToImagine()
  }
})

// RANKING COUNTER

function createCounterElement() {
  const counterElement = document.createElement('div')
  counterElement.id = 'counterDisplay'
  document.body.appendChild(counterElement)
  return counterElement
}
function insertStylesheet() {
  const style = document.createElement('style')
  style.type = 'text/css'
  style.innerHTML = `
    #counterDisplay {
      font-family: DM Sans,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif;
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background-color: #fff;
      font-weight: bold;
      font-size: 18px;
      line-height: 1;
      padding: 0.5rem 0.5rem;
      box-shadow: 4px 4px 12px rgba(126,128,127,0.4);
      border: 1px solid #888;
      border-radius: 0.5rem;
      color: #888;
    }
  `
  document.head.appendChild(style)
}

function checkAndResetCounterIfNeeded() {
  const now = new Date()
  // Convert current time to EST
  const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const resetCutoffTime = new Date(estTime)
  resetCutoffTime.setHours(20, 30, 0, 0) // Set to 7:30 PM EST on the current day

  const lastReset = localStorage.getItem('lastResetTime')
  const lastResetTime = lastReset ? new Date(lastReset) : null

  // If there's no last reset time or if the current time is past 7:30 PM EST and the last reset was before today's 7:30 PM
  if (!lastResetTime || (estTime > resetCutoffTime && lastResetTime < resetCutoffTime)) {
    localStorage.setItem('v6_ratingparty', '0') // Reset counter
    localStorage.setItem('lastResetTime', estTime.toISOString()) // Update last reset time with current date and time
    return 0 // Return the reset counter value
  }

  // If the current time is before today's 7:30 PM and the last reset was before yesterday's 7:30 PM
  if (estTime < resetCutoffTime) {
    const previousDayCutoffTime = new Date(resetCutoffTime)
    previousDayCutoffTime.setDate(previousDayCutoffTime.getDate() - 1) // Set to 7:30 PM EST on the previous day

    if (lastResetTime < previousDayCutoffTime) {
      localStorage.setItem('v6_ratingparty', '0') // Reset counter
      localStorage.setItem('lastResetTime', estTime.toISOString()) // Update last reset time
      return 0 // Return the reset counter value
    }
  }

  return parseInt(localStorage.getItem('v6_ratingparty') || '0', 10) // Return current counter value if no reset is needed
}

function initializeCounter() {
  insertStylesheet()
  let count = checkAndResetCounterIfNeeded()

  const counterDisplay = createCounterElement()
  const updateDisplay = () => {
    counterDisplay.textContent = count
  }

  const handleKeypress = event => {
    if (event.key === '1' || event.key === '2') {
      // Check and reset counter if needed before incrementing
      count = checkAndResetCounterIfNeeded()
      count++
      localStorage.setItem('v6_ratingparty', count.toString())
      updateDisplay()
    }
  }

  updateDisplay()
  document.addEventListener('keypress', handleKeypress)
}

function promptButtonKeycheck() {
  console.log('promptButtonKeycheck is INVOKED')

  // if (event.metaKey && event.altKey && event.shiftKey && event.key === 'p') {
  if (event.key === 'F6') {
    console.log('promptButtonKeycheck is TRUE')
    // Check for Opt+P
    event.preventDefault() // Prevent the default action of the keypress
    triggerPromptButtonClick() // Call the method to click the button
  }
}

function triggerPromptButtonClick() {
  console.log('triggerPromptButtonClick')
  const promptButton = document.querySelector('button.buttonActiveRing')

  if (promptButton && promptButton.textContent.includes('Prompt')) {
    promptButton.click()
  } else {
    console.log('Prompt button not foundx')
  }
}

function initializePromptButtonHotkey() {
  console.log('initializePromptButtonHotkey')
  document.addEventListener('keypress', promptButtonKeycheck)
}

function runWhenDOMReady() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', domActions)
  } else {
    domActions()
  }
}
function domActions() {
  initializeCounter()
  initializePromptButtonHotkey()
}

runWhenDOMReady()
