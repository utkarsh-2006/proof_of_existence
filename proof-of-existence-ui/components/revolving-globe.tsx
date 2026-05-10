"use client"

import { useEffect, useRef } from "react"

export function RevolvingGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const setCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    setCanvasSize()
    window.addEventListener("resize", setCanvasSize)

    const centerX = canvas.width / 2
    const centerY = canvas.height * 0.95
    const radius = Math.min(canvas.width, canvas.height) * 0.75
    let rotation = 0

    const points: { x: number; y: number; z: number; size: number }[] = []
    const latitudeBands = 35
    const longitudeBands = 60

    for (let lat = 0; lat <= latitudeBands; lat++) {
      const theta = (lat * Math.PI) / latitudeBands
      const sinTheta = Math.sin(theta)
      const cosTheta = Math.cos(theta)

      for (let lon = 0; lon <= longitudeBands; lon++) {
        const phi = (lon * 2 * Math.PI) / longitudeBands
        const x = Math.cos(phi) * sinTheta
        const y = cosTheta
        const z = Math.sin(phi) * sinTheta

        const rand = Math.random()
        let size = 0.6 // tiny (default)
        if (rand > 0.92) {
          size = 3.5 // 8% extra large dots
        } else if (rand > 0.82) {
          size = 2.5 // 10% large dots
        } else if (rand > 0.6) {
          size = 1.5 // 22% medium dots
        } else if (rand > 0.3) {
          size = 1.0 // 30% small dots
        }

        points.push({ x, y, z, size })
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      rotation += 0.0004

      // Draw points
      points.forEach((point) => {
        // Rotate around Y axis
        const rotatedX = point.x * Math.cos(rotation) - point.z * Math.sin(rotation)
        const rotatedZ = point.x * Math.sin(rotation) + point.z * Math.cos(rotation)
        const rotatedY = point.y

        if (rotatedZ > -0.2) {
          // Project 3D to 2D
          const scale = 1 / (1 - rotatedZ * 0.3)
          const x2d = centerX + rotatedX * radius * scale
          const y2d = centerY + rotatedY * radius * scale

          const baseOpacity = Math.max(0.1, Math.min(0.35, (rotatedZ + 1) * 0.18))

          // Dots are brightest on the right and fade as they move to center/left
          const xFactor = Math.max(0, rotatedX) // 0 to 1 for right side, 0 for left
          const brightnessBoost = xFactor * 0.3 // Add up to 0.3 extra opacity on the right
          const finalOpacity = Math.min(0.7, baseOpacity + brightnessBoost)

          // Draw dot with variable size
          ctx.beginPath()
          ctx.arc(x2d, y2d, point.size * scale, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`
          ctx.fill()
        }
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", setCanvasSize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />
}
