import get_pass from './pass'

function helloWorld() {
  const element = document.getElementById("hello-world");
  if (element) {
    element.textContent = get_pass();
  }
}

helloWorld();