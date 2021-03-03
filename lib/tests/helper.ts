const div = document.createElement('div');
div.id = "test-container"
div.style.width = "100%";
div.style.height = "100vh";
document.body.appendChild(div)

beforeEach(() => {
    div.innerHTML = "";
})