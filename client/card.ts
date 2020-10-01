// import { TextBox } from './archive/text'
// import { Point, Size, Path, Rectangle, Color, Project, Group } from 'paper'
import ArrowDown from './icons/box-arrow-in-down.svg' 
import ArrowUp from './icons/box-arrow-in-up.svg' 
import Trash from './icons/trash.svg'
import Share from './icons/share.svg'
import { View } from './view'
import Quill from 'quill';
import { Vector, Size } from './types'

// // const defaultMargin = new Size(15, 15)
// const defaultBarHeight = 30
// const iconClearance = 12
// const iconSize = 20

export class Card {
    cardID: number
    quill: Quill;
    view: View;
    element: HTMLElement
    toolbar: HTMLElement
    editor: HTMLElement

    private position: Vector
    
    // The following might not be necessary and managed by the view
    parent: Card | null = null
    children: Card[] = []
    
    constructor(view: View, id: number, pos: Vector, width: number, content?: string) {
      this.cardID = id
      const container = document.createElement("div")
      container.id = "card" + this.cardID
      container.style.position = "absolute"
      container.style.left = pos.x + "px"
      container.style.top = pos.y + "px"
      container.style.width = width + "px"
      this.element = container
      this.view = view
      this.view.element.appendChild(container)
      this.position = pos
      
      const editor = document.createElement("div")
      editor.style.height = "100px";
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
          let length = quill.getLength()
          let bounds = quill.getBounds(length - 1)
          console.log(bounds.height + bounds.top)
          editor.style.height = (bounds.bottom + 12) + "px"
      });
      
      editor.style.borderTop = "1px solid #ccc";
      editor.style.borderBottom = "0px solid #ccc";
      
      this.quill = quill
      this.editor = editor

    }
    
    // // input handles keyboard inputs directed to this card
    // input(char: string): void {
    //     if (this.text.text() === "" && char == "Backspace") {
    //         this.view.deleteCard()
    //     } else if (this.text.cursor.row === 0 && char === "ArrowUp") {
    //         // move up to the next card if we have reached the top of this
    //         this.view.up()
    //     } else if (this.text.lastLine() && char === "ArrowDown") {
    //         // move down to the card below if we have reached the bottom of this
    //         this.view.down()
    //     } else {
    //         this.text.input(char)
    //         if (this.text.box.height + (2 * this.margin.height) + defaultBarHeight !== this.box.bounds.height ) {
    //             this.box.bounds.height = this.text.box.height + (2 * this.margin.height) + defaultBarHeight
    //             this.bar.position.y = this.box.position.y + (this.box.bounds.height/2) - defaultBarHeight
    //             this.icons.position.y = this.bar.position.y + this.icons.bounds.height / 2 + 3
    //         }
    //     }
    // }
    
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
      this.position = newPos
    }
    
    translate(delta: Vector): void {
        this.element.style.left = (parseInt(this.element.style.left, 10) + delta.x) + "px"
        this.element.style.top = (parseInt(this.element.style.top, 10) + delta.y) + "px"
        this.position.x += delta.x
        this.position.y += delta.y
    }
    
    height(): number {
      return this.element.clientHeight
    }
    
    pos(): Vector {
      return this.position
    }

    activate(): void {
        this.quill.enable()
        this.editor.style.border = "1px solid #ccc"
        this.editor.style.borderBottom = "none"
        this.toolbar.style.display = "block";
    }

    deactivate(): void {
      this.editor.style.border = "none"
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
        {svg: Share, func: () => { alert("Hello World")}},
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
      toolbar.id = "toolbar" + this.cardID
      toolbar.appendChild(this.createCustomToolbar())
      let fontSize = document.createElement('select')
      fontSize.className = "ql-header"
      for (let idx = 1; idx <= 3; idx ++) {
        let option = document.createElement('option')
        option.value = idx.toString()
        fontSize.appendChild(option)
      }
      let normal = document.createElement('option')
      normal.selected = true;
      fontSize.appendChild(normal)
      toolbar.appendChild(fontSize)
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

