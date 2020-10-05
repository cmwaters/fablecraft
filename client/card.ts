// import { TextBox } from './archive/text'
// import { Point, Size, Path, Rectangle, Color, Project, Group } from 'paper'
import ArrowDown from './icons/box-arrow-in-down.svg' 
import ArrowUp from './icons/box-arrow-in-up.svg' 
import Trash from './icons/trash.svg'
import Share from './icons/share.svg'
import { View } from './view'
import Quill from 'quill';
import { Vector, Size, Geometry } from './types'

const g = Geometry

// // const defaultMargin = new Size(15, 15)
// const defaultBarHeight = 30
// const iconClearance = 12
// const iconSize = 20

export class Card {
    // cardID: number
    quill: Quill;
    view: View;
    element: HTMLElement
    toolbar: HTMLElement
    editor: HTMLElement
    
    // The following might not be necessary and managed by the view
    parentIdx: number | null = null
    firstChildIdx: number | null = null
    childrenCount: number = 0
    
    constructor(view: View, pos: Vector, width: number, content?: string) {
      // this.cardID = id
      const container = document.createElement("div")
      // container.id = "card" + this.cardID
      container.style.position = "absolute"
      container.style.left = pos.x + "px"
      container.style.top = pos.y + "px"
      container.style.width = width + "px"
      container.style.zIndex = "1";
      this.element = container
      this.view = view
      this.view.element.appendChild(container)
      
      const editor = document.createElement("div")
      container.appendChild(editor)
      
      this.toolbar = this.createToolbar(container)
      
      let quill = new Quill(editor, {
        modules: {
          toolbar: this.toolbar,
        },
        theme: 'snow'  // or 'bubble'
      });
      if (content !== undefined) {
        quill.setText(content)
      }
      
      let bounds = quill.getBounds(quill.getLength() - 1)
      editor.style.height = (bounds.bottom + 12) + "px" 
      
      quill.on('text-change', function(delta, oldDelta, source) {
          let existingHeight = editor.offsetHeight
          console.log(existingHeight)
          let length = quill.getLength()
          let bounds = quill.getBounds(length - 1)
          let heightDiff = bounds.bottom + 12 - existingHeight
          editor.style.height = (bounds.bottom + 12) + "px"
          console.log("height diff: " + heightDiff)
          this.view.slideBottom(heightDiff)
      }.bind(this));
      
      editor.style.borderTop = "1px solid #ccc";
      editor.style.borderBottom = "0px solid #ccc";
      
      this.quill = quill
      this.editor = editor

    }
    
    // resize changes the width of the current card which may result in a reshuffling of the 
    // text and a new height which is returned
    // resize(newWidth: number): number {
    //     this.box.bounds.width = newWidth
    //     this.bar.bounds.width = newWidth
    //     this.box.bounds.height = this.text.resize(newWidth - (2 * this.margin.width)) + (2 * this.margin.height) + defaultBarHeight
    //     this.bar.position.y = this.box.position.y + (this.box.bounds.height/2) - defaultBarHeight
    //     this.icons.position.y = this.bar.position.y + this.icons.bounds.height / 2 + 3
    //     return this.box.bounds.height
    // }

    move(newPos: Vector): void {
      this.element.style.left = newPos.x + "px"
      this.element.style.top = newPos.y + "px"
    }
    
    translate(delta: Vector): void {
        this.element.style.left = (this.element.offsetLeft + delta.x) + "px"
        this.element.style.top = (this.element.offsetTop + delta.y) + "px"
    }
    
    height(): number {
      return this.element.offsetHeight
    }
    
    pos(): Vector {
      return {x: this.element.offsetLeft, y: this.element.offsetTop}
    }
    
    centerPos(): Vector {
      return g.add(this.pos(), g.center({width: this.element.offsetWidth, height: this.element.offsetHeight}))
    }
    
    string(): string {
      return "pos, " + g.string(this.pos()) + ", height: " + this.height() + " width: " + this.element.offsetWidth
    }

    activate(): void {
        this.quill.enable()
        this.editor.style.borderColor = "#ccc"
        // this.editor.style.borderBottom = "none"
        this.toolbar.style.display = "block";
    }

    deactivate(): void {
      this.editor.style.borderColor = "#fff"
      this.toolbar.style.display = "none";
      this.quill.blur()
      this.quill.enable(false)
    }
    
    remove(): void {
        this.element.parentNode.removeChild(this.element)
    }
    
    createCustomToolbar(): HTMLElement {
      let toolbar = document.createElement('div')
      toolbar.className = "custom-toolbar"
      let customButtons = [
        {svg: ArrowDown, func: () => { this.view.createBelow() }},
        {svg: ArrowUp, func: () => { this.view.createAbove() }},
        {svg: Share, func: () => { this.view.branch() }},
        {svg: Trash, func: () => { this.view.deleteCard() }},
      ]
      customButtons.forEach(button => {
        let b = document.createElement('button')
        b.innerHTML = button.svg
        b.style.outline = "none";
        b.onclick = button.func
        toolbar.appendChild(b)
      })
      return toolbar
    }
    
    createToolbar(parent: HTMLElement): HTMLElement {
      let toolbar = document.createElement("div")
      // toolbar.id = "toolbar" + this.cardID
      toolbar.appendChild(this.createCustomToolbar())
      // let fontSize = document.createElement('select')
      // fontSize.className = "ql-header"
      // for (let idx = 1; idx <= 3; idx ++) {
      //   let option = document.createElement('option')
      //   option.value = idx.toString()
      //   fontSize.appendChild(option)
      // }
      // let normal = document.createElement('option')
      // normal.selected = true;
      // fontSize.appendChild(normal)
      // toolbar.appendChild(fontSize)
      let buttons = ['ql-bold', 'ql-italic', 'ql-underline']
      buttons.forEach(type => {
        let button = document.createElement('button')
        button.className = type
        toolbar.appendChild(button)
      })
      parent.appendChild(toolbar)
      return toolbar
    }

}

