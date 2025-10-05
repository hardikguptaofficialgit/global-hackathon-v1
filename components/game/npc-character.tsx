import * as THREE from "three"
import type { NPCState } from "@/lib/npc-ai"

export function createNPCMesh(npc: NPCState): THREE.Group {
  const npcGroup = new THREE.Group()
  npcGroup.name = npc.id

  // Body color based on type
  const bodyColor = npc.type === "waiter" ? 0x2c2c2c : 0x8b4513

  // Body
  const bodyGeometry = new THREE.CapsuleGeometry(0.3, 1.0, 4, 8)
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.7,
  })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.castShadow = true
  npcGroup.add(body)

  // Head
  const headGeometry = new THREE.SphereGeometry(0.25, 16, 16)
  const headMaterial = new THREE.MeshStandardMaterial({
    color: 0xffdbac,
    roughness: 0.8,
  })
  const head = new THREE.Mesh(headGeometry, headMaterial)
  head.position.y = 0.75
  head.castShadow = true
  npcGroup.add(head)

  // Waiter apron or receptionist badge
  if (npc.type === "waiter") {
    const apronGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.05)
    const apronMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.8,
    })
    const apron = new THREE.Mesh(apronGeometry, apronMaterial)
    apron.position.set(0, 0.1, 0.31)
    npcGroup.add(apron)
  }

  // Name tag
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")!
  canvas.width = 256
  canvas.height = 64
  context.fillStyle = "rgba(0, 0, 0, 0.7)"
  context.fillRect(0, 0, 256, 64)
  context.fillStyle = "#ffffff"
  context.font = "bold 24px Arial"
  context.textAlign = "center"
  context.fillText(npc.name, 128, 40)

  const texture = new THREE.CanvasTexture(canvas)
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
  const sprite = new THREE.Sprite(spriteMaterial)
  sprite.scale.set(2, 0.5, 1)
  sprite.position.y = 1.5
  sprite.name = "nameTag"
  npcGroup.add(sprite)

  npcGroup.position.copy(npc.position)
  npcGroup.position.y = 0.8

  return npcGroup
}

export function createDialogueBubble(text: string): THREE.Sprite {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")!
  canvas.width = 512
  canvas.height = 128

  // Measure text to determine bubble size
  context.font = "bold 28px Arial"
  const textMetrics = context.measureText(text)
  const textWidth = textMetrics.width
  const padding = 40

  // Draw bubble background
  context.fillStyle = "rgba(255, 255, 255, 0.95)"
  context.strokeStyle = "rgba(0, 0, 0, 0.8)"
  context.lineWidth = 4

  const bubbleWidth = Math.min(textWidth + padding * 2, 480)
  const bubbleHeight = 80
  const x = (512 - bubbleWidth) / 2
  const y = 10

  // Rounded rectangle
  context.beginPath()
  context.roundRect(x, y, bubbleWidth, bubbleHeight, 15)
  context.fill()
  context.stroke()

  // Draw text
  context.fillStyle = "#000000"
  context.font = "bold 28px Arial"
  context.textAlign = "center"
  context.textBaseline = "middle"

  // Word wrap
  const words = text.split(" ")
  const lines: string[] = []
  let currentLine = ""

  words.forEach((word) => {
    const testLine = currentLine + word + " "
    const metrics = context.measureText(testLine)
    if (metrics.width > bubbleWidth - padding && currentLine !== "") {
      lines.push(currentLine)
      currentLine = word + " "
    } else {
      currentLine = testLine
    }
  })
  lines.push(currentLine)

  const lineHeight = 32
  const startY = y + bubbleHeight / 2 - ((lines.length - 1) * lineHeight) / 2

  lines.forEach((line, i) => {
    context.fillText(line.trim(), 256, startY + i * lineHeight)
  })

  const texture = new THREE.CanvasTexture(canvas)
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  })
  const sprite = new THREE.Sprite(spriteMaterial)
  sprite.scale.set(4, 1, 1)
  sprite.position.y = 2.5
  sprite.name = "dialogueBubble"

  return sprite
}
