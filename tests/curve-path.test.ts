import { beforeEach, describe, expect, it, vi } from 'vitest'

class PathRecorder {
    commands: Array<Record<string, unknown>> = []

    moveTo(x: number, y: number): void {
        this.commands.push({ command: 'moveTo', x, y })
    }

    lineTo(x: number, y: number): void {
        this.commands.push({ command: 'lineTo', x, y })
    }

    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        this.commands.push({ command: 'quadraticCurveTo', cpx, cpy, x, y })
    }
}

describe('smoothed curve path', () => {
    beforeEach(() => {
        vi.stubGlobal('Path2D', PathRecorder)
    })

    it('returns an empty path for fewer than two points', async () => {
        const { buildSmoothedCurvePath } = await import('/src/utils/canvas')

        expect((buildSmoothedCurvePath([]) as unknown as PathRecorder).commands).toEqual([])
        expect((buildSmoothedCurvePath([{ x: 10, y: 10 }]) as unknown as PathRecorder).commands).toEqual([])
    })

    it('creates a line for two points', async () => {
        const { buildSmoothedCurvePath } = await import('/src/utils/canvas')
        const path = buildSmoothedCurvePath([{ x: 1, y: 2 }, { x: 5, y: 8 }]) as unknown as PathRecorder

        expect(path.commands).toEqual([
            { command: 'moveTo', x: 1, y: 2 },
            { command: 'lineTo', x: 5, y: 8 }
        ])
    })

    it('smooths interior points and preserves the final pointer position', async () => {
        const { buildSmoothedCurvePath } = await import('/src/utils/canvas')
        const path = buildSmoothedCurvePath([
            { x: 0, y: 0 },
            { x: 10, y: 20 },
            { x: 20, y: 0 }
        ]) as unknown as PathRecorder

        expect(path.commands).toEqual([
            { command: 'moveTo', x: 0, y: 0 },
            { command: 'quadraticCurveTo', cpx: 10, cpy: 20, x: 15, y: 10 },
            { command: 'lineTo', x: 20, y: 0 }
        ])
    })
})
