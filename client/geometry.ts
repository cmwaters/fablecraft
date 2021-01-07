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

}

export class PIC {
  kp: number
  ki: number
  errorSum: Vector = new Vector();

  target: Vector
  current: Vector
  interval: NodeJS.Timeout | null = null;
  period: number
  proximityPercentage = 0.01; 
  updateFunc: (pos: Vector) => void

  constructor(pos: Vector, updateFunc: (pos: Vector) => void, period: number, proportionalGain: number, integralGain: number = 0) {
    this.target = pos
    this.current = pos
    this.kp = proportionalGain
    this.ki = integralGain
    this.period = period
    this.updateFunc = updateFunc
  }

  // sets the target that the controller will converge on. Targets can be altered before the new
  // target is reached. 
  set(target: Vector) {
    this.target = target
    if (!this.interval) {
      this.interval = setInterval(() => {
        // calculate the error
        let error = this.target.subtract(this.current)
        // check termination condition
        if (error.abs().isLessThan(this.target.multiply(this.proximityPercentage))) {
          this.current = this.target
          clearInterval(this.interval)
          this.interval = null
        }
        // calculate the proportional part
        let gain = error.multiply(this.kp)
        // update the accumulative error
        this.errorSum.shift(error)
        // add the integral part
        gain.shift(this.errorSum.multiply(this.ki))
        // update current pos
        this.current.shift(gain)
        this.updateFunc(this.current)
      }, this.period)
    }
  }

  // used to move the target vector by a relative vector
  shift(delta: Vector) {
    this.set(this.target.add(delta))
  }


}
