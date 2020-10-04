export type Vector = {
  x: number,
  y: number
}

export type Size = {
  width: number,
  height: number
}

export namespace Geometry {

  export function add(v1: Vector, v2: Vector): Vector {
    return {x: v1.x + v2.x, y: v1.y + v2.y}
  }

  export function subtract(v1: Vector, v2: Vector): Vector {
    return {x: v1.x - v2.x, y: v1.y - v2.y}
  }

  export function center(s: Size): Vector {
    return {x: s.width / 2, y: s.height /2 }
  }

  export function inside(pos: Vector, box: Size, point: Vector): boolean {
    return point.x > pos.x && point.x < pos.x + box.width && point.y > pos.y && point.y < pos.y + box.height
  }

  export function multiply(vec: Vector, val: number): Vector {
    return {x: vec.x * val, y: vec.y * val}
  }

  export function string(vec: Vector): string {
    return "x: " + vec.x + ", y: " + vec.y
  }

  export function round(vec: Vector, dp: number = 0): Vector {
    return {x: Math.round(vec.x), y: Math.round(vec.y)}
  }

}
