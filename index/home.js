function expand(event, sectionName) {
       event.preventDefault();
       const element = document.getElementById(`${sectionName}-details`);
       element.setAttribute('class', 'expanded');
}

document.getElementById("blocks")
    .addEventListener("click", (event) => expand(event, "blocks"));

