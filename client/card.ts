// import { TextBox } from './archive/text'
// import { Point, Size, Path, Rectangle, Color, Project, Group } from 'paper'
import ArrowDown from './icons/box-arrow-in-down.svg' 
import ArrowUp from './icons/box-arrow-in-up.svg' 
import ArrowRight from './icons/box-arrow-right.svg'
import ArrowLeft from './icons/box-arrow-left.svg'
import Trash from './icons/trash.svg'

import { Node } from './story'
import { View } from './view'
import { Quill, DeltaOperation } from 'quill';
import { Vector, Geometry } from './types'

const g = Geometry

// // const defaultMargin = new Size(15, 15)
// const defaultBarHeight = 30
// const iconClearance = 12
// const iconSize = 20

export class Card {
    // cardID: number
    quill: Quill;
    view: View;
    node: Node
    element: HTMLElement
    toolbar: HTMLElement
    editor: HTMLElement
    
    // The following might not be necessary and managed by the view
    parentIdx: number | null = null
    firstChildIdx: number | null = null
    childrenCount: number = 0
    
    constructor(view: View, pos: Vector, width: number, node: Node) {
      this.node = node
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
      if (this.node.text !== "") {
        quill.setText(this.node.text)
      }
      
      let bounds = quill.getBounds(quill.getLength() - 1)
      editor.style.height = (bounds.bottom + 12) + "px" 
      
      quill.on('text-change', function(delta, oldDelta, source) {
          // update height if need be
          let existingHeight = editor.offsetHeight
          let length = quill.getLength()
          let bounds = quill.getBounds(length - 1)
          let heightDiff = bounds.bottom + 12 - existingHeight
          editor.style.height = (bounds.bottom + 12) + "px"
          this.view.slideBottom(heightDiff)

          // update snippet
          console.log(delta)
          delta.forEach((op: DeltaOperation, index: number): void => { 
            console.log(op)
          })

      }.bind(this));

      node.addEvent(function(text: string) {
        // update the text in the quill text box
        quill.setText(text)
      })
      
      editor.style.borderTop = "1px solid #ccc";
      editor.style.borderBottom = "0px solid #ccc";
      
      this.quill = quill
      this.editor = editor

    }
    
    // resize changes the width of the current card which may result in a reshuffling of the 
    // text and a new height which is returned
    resize(newWidth: number): void {
    //     this.box.bounds.width = newWidth
    //     this.bar.bounds.width = newWidth
    //     this.box.bounds.height = this.text.resize(newWidth - (2 * this.margin.width)) + (2 * this.margin.height) + defaultBarHeight
    //     this.bar.position.y = this.box.position.y + (this.box.bounds.height/2) - defaultBarHeight
    //     this.icons.position.y = this.bar.position.y + this.icons.bounds.height / 2 + 3
    //     return this.box.bounds.height
    }

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
        this.toolbar.style.display = "block";
    }

    deactivate(): void {
      this.editor.style.borderColor = "#fff"
      this.toolbar.style.display = "none";
      this.quill.blur()
      this.quill.enable(false)
    }

    focus(): void {
      this.editor.style.borderColor = "#888"
      this.toolbar.style.borderColor = "#888"
      this.quill.focus()
    }

    blur(): void {
      this.editor.style.borderColor = "#ccc"
      this.toolbar.style.borderColor = "#ccc"
      this.quill.blur()
    }
    
    remove(): void {
        this.element.parentNode.removeChild(this.element)
    }
    
    createViewToolbar(): HTMLElement {
      let toolbar = document.createElement('div')
      toolbar.className = "custom-toolbar"
      let customButtons = [
        {svg: ArrowDown, func: () => { this.view.createBelow() }},
        {svg: ArrowUp, func: () => { this.view.createAbove() }},
        {svg: ArrowLeft, func: () => { this.view.createParent() }},
        {svg: ArrowRight, func: () => { this.view.branch() }},
        {svg: Trash, func: () => { this.view.deleteCardAndReorganize() }},
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

      toolbar.appendChild(this.createViewToolbar())

      let module = document.createElement('div')
      module.className = "custom-toolbar"
      let blockButtons = [
          {class: 'ql-image', value: null},
          {class: 'ql-blockquote', value: null},
          {class: 'ql-code-block', value: null},
          {class: 'ql-list', value: "ordered"}, 
          {class: 'ql-list', value: "bullet"}
      ]
      blockButtons.forEach(type => { 
        let b = document.createElement('button')
        b.className = type.class
        if (type.value !== null) {
          b.value = type.value
        }
        module.appendChild(b)
      })
      toolbar.appendChild(module)

      for (let idx = 1; idx < 3; idx++) {
        let button = document.createElement('button')
        button.className = 'ql-header'
        button.value = idx.toString()
        toolbar.appendChild(button)
      }

      let textButtons = ['ql-bold', 'ql-italic', 'ql-underline', 'ql-strike']
      textButtons.forEach(type => {
        let button = document.createElement('button')
        button.className = type
        toolbar.appendChild(button)
      })



      parent.appendChild(toolbar)
      return toolbar
    }

}

