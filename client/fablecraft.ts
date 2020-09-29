import ArrowDown from './icons/box-arrow-in-down.svg' 
import ArrowUp from './icons/box-arrow-in-up.svg' 
import Trash from './icons/trash.svg'
import Share from './icons/share.svg'
import Story from './story'
import Axios from "axios";
import Quill from 'quill';

window.onload = () => {
    console.log("Starting fablecraft");
    console.log(window.devicePixelRatio);
    
    const view = document.createElement("div")
    view.style.width = "100%"
    document.body.appendChild(view)
    
    const container = document.createElement("div")
    container.style.width = "600px";
    // container.style.height = "100px";
    container.style.position = "relative";
    container.style.margin = "auto";
    view.appendChild(container)
    
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
    

    const loginData = {
        email: "test",
        password: "test",
    };
    // strictly used for testing create a user if we don't already have one
    Axios.post("/auth/login", loginData)
        .then(function (response) {
            console.log(response.data.token);
            const token = response.data.token;
            Axios.get("/api/story/5f68b47773ea6658a5cf5617/", { params: { token: token } })
                .then(function (response) {
                    console.log(response.data);
                    let story = new Story(response.data.story.title, [{text: "Essentially the problem is that the Genesis State does not contain a header, though it does have a timestamp and an initial validator set. We should still be able to initialize from it - we can consider it height 0.", depth: 1, index: 1, parentIndex: null}]);
                })
                .catch(function (error) {
                    console.log(error);
                });
        })
        .catch(function (error) {
            console.log(error);
        });
};

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

export function getTextWidth(text: string, font: Font): number {
  // re-use canvas object for better performance
  var canvas = <HTMLCanvasElement> document.createElement("canvas");
  var context = canvas.getContext("2d");
  if (context === null) return 0;
  context.font = fontString(font)
  var metrics = context.measureText(text);
  return metrics.width;
}

type Font = {
  family: string,
  size: number,
  weight?: string,
}

function fontString(font: Font) {
  return font.size.toString() + "px " + font.family
}
