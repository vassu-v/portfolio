for (let i of products.data) {
    //create Card
    let card = document.createElement("div");
    card.classList.add("card", "hide");
    //image div
    let imgContainer = document.createElement("div");
    imgContainer.classList.add("image-container");
    //img tag
    let image = document.createElement("img");
    image.setAttribute("src", i.image);
    imgContainer.appendChild(image);
    card.appendChild(imgContainer);
    //container
    let container = document.createElement("div");
    container.classList.add("container");
    //Product Name
    let name = document.createElement("h3");
    name.classList.add("name");
    name.innerText = i.productName.toUpperCase();
    container.appendChild(name);
    //price
    let price = document.createElement("h3");
    price.innerText = "$" + i.price;
    container.appendChild(price);
    //description
    //details tag
    let description = document.createElement("details");
    description.innerText = i.Description;
    container.appendChild(description);
    //summary tag
    let short = document.createElement("summary");
    short.innerText = i.SD;
    description.appendChild(short);

    //configuring card & container
    card.appendChild(container);
    document.getElementById("products").appendChild(card);
}

//when search button clicked
let bum = document.getElementById("search")
bum.addEventListener("click", () => {
    let searchInput = document.getElementById("search-input").value.toUpperCase();
    //console.log(searchInput)
    let elements = document.querySelectorAll(".name")
    //console.log(elements)
    let cards = document.querySelectorAll(".card")
    //console.log(cards)

    //if the elemts innertext is equal to search-input
    elements.forEach((element, index) => {
        if (element.innerHTML.includes(searchInput)) {
            //show matching cards
            //console.log(element)
            cards[index].classList.remove("hide")
            
        }
        else {
            //hide unmatched cards
            //console.log(searchInput)
            cards[index].classList.add("hide")
        }
    })
})

//initially display all products
window.onload = () => {
    let elements = document.querySelectorAll(".card");
    elements.forEach(element => {
        element.classList.remove("hide");
    })
}