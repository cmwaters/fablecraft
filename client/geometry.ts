export class Vector {
  x: number
  y: number

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  static create(x: number = 0, y: number = 0): Vector {
    return new Vector(x,y)
  }

  static y(y: number): Vector {
    return new Vector(0, y)
  }

  static x(x: number): Vector {
    return new Vector(x)
  }

  add(v: Vector): Vector {
    return new Vector(this.x + v.x, this.y + v.y)
  }

  shift(delta: Vector) {
    this.x += delta.x
    this.y += delta.y
  }

  abs(): Vector {
    return new Vector(Math.abs(this.x), Math.abs(this.y))
  }

  isLessThan(v: Vector): boolean {
    return this.x < v.x && this.y < v.y
  }

  subtract(v: Vector): Vector {
    return new Vector(this.x - v.x, this.y - v.y)
  }

  inside(point: Vector, box: Size, ): boolean {
    return point.x > this.x && point.x < this.x + box.width && point.y > this.y && point.y < this.y + box.height
  }

  multiply(val: number): Vector {
    return new Vector(this.x * val, this.y * val)
  }

  divide(val: number): Vector {
    return new Vector(this.x / val, this.y / val)
  }

  string(): string {
    return "x: " + this.x + ", y: " + this.y
  }
  
  copy(): Vector {
    return new Vector(this.x, this.y)
  }

  static fromEl(element: HTMLElement): Vector {
    return new Vector(element.offsetLeft, element.offsetTop)
  }
}

export class Size { 
  width: number
  height: number

  constructor(width: number = 0, height: number = 0) {
    this.width = width
    this.height = height
  }

  center(): Vector {
    return new Vector(this.width / 2, this.height /2)
  }

  diff(size: Size): Size {
    return new Size(size.width -this.width, size.height - this.height)
  }

  modifyEl(element: HTMLElement) {
    element.style.width = this.width + "px"
    element.style.height = this.height + "px"
  }

  divide(denominator: number): Size {
    return new Size(this.width/ denominator, this.height/denominator)
  }

  static fromEl(element: HTMLElement): Size {
    return new Size(element.offsetWidth, element.offsetHeight)
  }

}