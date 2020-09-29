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
    quill: Quill
    margin: Size
    view: View
    
    // The following might not be necessary and managed by the view
    parent: Card | null = null
    children: Card[] = []
    
    constructor(view: View, pos: Vector, width: number, content?: string) {
      const container = document.createElement("div")
      container.style.position = "absolute"
      container.style.left = 
      container.style.width = width + "px"
      container.style.position = "relative";
      container.style.margin = "auto";
      view.element.appendChild(container)
      
      const editor = document.createElement("div")
      editor.style.height = "100px";
      container.appendChild(editor)
      
      createToolbar(container)
      
      let quill = new Quill(editor, {
        modules: {
          toolbar: "#toolbar",
        },
        theme: 'snow'  // or 'bubble'
      });
      quill.setText(content)
      
      let bounds = quill.getBounds(0)
      editor.style.height = (bounds.bottom + 12) + "px" 

      
      quill.on('text-change', function(delta, oldDelta, source) {
          let length = quill.getLength()
          let bounds = quill.getBounds(length - 1)
          console.log(bounds.height + bounds.top)
          editor.style.height = (bounds.bottom + 12) + "px"
      });
      
      editor.style.borderTop = "1px solid #ccc";
      editor.style.borderBottom = "0px solid #ccc";

    }
    
    // input handles keyboard inputs directed to this card
    input(char: string): void {
        if (this.text.text() === "" && char == "Backspace") {
            this.view.deleteCard()
        } else if (this.text.cursor.row === 0 && char === "ArrowUp") {
            // move up to the next card if we have reached the top of this
            this.view.up()
        } else if (this.text.lastLine() && char === "ArrowDown") {
            // move down to the card below if we have reached the bottom of this
            this.view.down()
        } else {
            this.text.input(char)
            if (this.text.box.height + (2 * this.margin.height) + defaultBarHeight !== this.box.bounds.height ) {
                this.box.bounds.height = this.text.box.height + (2 * this.margin.height) + defaultBarHeight
                this.bar.position.y = this.box.position.y + (this.box.bounds.height/2) - defaultBarHeight
                this.icons.position.y = this.bar.position.y + this.icons.bounds.height / 2 + 3
            }
        }
    }
    
    // resize changes the width of the current card which may result in a reshuffling of the 
    // text and a new height which is returned
    resize(newWidth: number): number {
        this.box.bounds.width = newWidth
        this.bar.bounds.width = newWidth
        this.box.bounds.height = this.text.resize(newWidth - (2 * this.margin.width)) + (2 * this.margin.height) + defaultBarHeight
        this.bar.position.y = this.box.position.y + (this.box.bounds.height/2) - defaultBarHeight
        this.icons.position.y = this.bar.position.y + this.icons.bounds.height / 2 + 3
        return this.box.bounds.height
    }

    move(newPos: paper.Point): void {
        let delta = newPos.subtract(this.position())
        this.translate(delta)
    }
    
    position(): paper.Point {
        return this.box.position.subtract(new Point(this.box.bounds.width/2, this.box.bounds.height/2)) 
    }
    
    size(): paper.Size {
        return new Size(this.box.bounds.width, this.box.bounds.height)
    }
    
    translate(delta: paper.Point): void {
        this.box.translate(delta)
        this.bar.translate(delta)
        this.text.translate(delta)
        this.icons.translate(delta)
    }

    activate(): void {
        this.box.strokeColor = new Color(0.8, 0.8, 0.8, 1);
        this.bar.visible = true;
        this.icons.visible = true;
    }

    deactivate(): void {
        this.box.strokeColor = new Color("white");
        this.bar.visible = false;
        this.icons.visible = false;
        this.text.deactivate()
    }
    
    remove(): void {
        this.box.remove()
        this.bar.remove()
        this.icons.remove()
        this.text.remove()
    }

    textMode(): boolean {
        return this.text.pointer.visible
    }
    
    handleClick(pos: paper.Point): void {
        console.log(pos)
        if (this.text.box.contains(pos)) {
            this.text.activate()
            console.log("clicked on text")
            this.text.setCursorPos(pos)
        }
    }

}

function createCustomToolbar(): HTMLElement {
  let toolbar = document.createElement('div')
  toolbar.className = "custom-toolbar"
  let customButtons = [
    {svg: ArrowDown, func: () => { alert("Hello World")}},
    {svg: ArrowUp, func: () => { alert("Hello World")}},
    {svg: Share, func: () => { alert("Hello World")}},
    {svg: Trash, func: () => { alert("Hello World")}},
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

function createToolbar(parent: HTMLElement): void {
  let toolbar = document.createElement("div")
  toolbar.id = "toolbar"
  toolbar.appendChild(createCustomToolbar())
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
}

