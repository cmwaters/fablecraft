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

}
// export class Block {
//   element: HTMLElement
//   position: Vector
//   size: Size


//   constructor(bo: BlockOptions) {
//     this.element = document.createElement('div')
//     this.element.style.position = "absolute"
//     this.element.style.width = bo.size.width + "px"
//     this.element.style.height = bo.size.height + "px"
//     this.element.style.left = bo.position.x + "px"
//     this.element.style.top = bo.position.y + "px"
//     this.position = bo.position
//     this.size = bo.size
//     if (bo.parent !== null) {
//       bo.parent.appendChild(this.element)
//     }
//   } 

//   move(newPos: Vector): void {
//     this.element.style.left = newPos.x + "px"
//     this.element.style.top = newPos.y + "px"
//     this.position = newPos
//   }
  
//   shift(deltaPos: Vector): void {
//     let newPos = {x: this.position.x + deltaPos.x, y: this.position.y + deltaPos.y}
//     this.move(newPos)
//   }
  
//   resize(newSize: Size): void {
//     this.element.style.width = newSize.width + "px"
//     this.element.style.height = newSize.height + "px"
//     this.size = newSize
//   }

// }

// export type BlockOptions = {
//   parent: HTMLElement | null
//   position: Vector
//   size: Size
// }