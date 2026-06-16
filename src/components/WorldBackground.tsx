import { Graphics } from '@pixi/react'
import type { Graphics as PixiGraphics } from '@pixi/graphics'
import { useCallback } from 'react'

type WorldBackgroundProps = {
  width: number
  height: number
  transparent?: boolean
}

export function WorldBackground({ width, height, transparent = false }: WorldBackgroundProps) {
  const drawBackground = useCallback(
    (graphics: PixiGraphics) => {
      graphics.clear()

      if (transparent) {
        return
      }

      graphics.beginFill(0x0d1b22)
      graphics.drawRect(0, 0, width, height)
      graphics.endFill()

      graphics.beginFill(0x14303a, 0.85)
      graphics.drawRect(0, height * 0.55, width, height * 0.45)
      graphics.endFill()

      const mountainLayers = [
        { color: 0x1a3d45, alpha: 0.55, baseY: 0.62, amplitude: 0.12 },
        { color: 0x234952, alpha: 0.7, baseY: 0.68, amplitude: 0.1 },
        { color: 0x2f5a63, alpha: 0.85, baseY: 0.74, amplitude: 0.08 },
      ]

      mountainLayers.forEach(({ color, alpha, baseY, amplitude }) => {
        graphics.beginFill(color, alpha)
        graphics.moveTo(0, height)

        for (let x = 0; x <= width; x += 24) {
          const wave = Math.sin((x / width) * Math.PI * 4) * height * amplitude
          graphics.lineTo(x, height * baseY + wave)
        }

        graphics.lineTo(width, height)
        graphics.closePath()
        graphics.endFill()
      })

      graphics.beginFill(0xc9a45c, 0.08)
      graphics.drawEllipse(width * 0.78, height * 0.18, width * 0.12, height * 0.08)
      graphics.endFill()
    },
    [height, transparent, width],
  )

  return <Graphics draw={drawBackground} />
}
