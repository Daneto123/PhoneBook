// изквиква контактите ,за да се покажат
document.addEventListener('DOMContentLoaded', () => {
    getItems();
    getItemsFavorite()

});



// middleware за показване на контактите
function getItems() {
    fetch('http://localhost:3000/contacts')
        .then((response) => response.json())
        .then((listItems) => {
            if (listItems && listItems.length !== 0) {
                listItems.map(item => {
                    const li = document.createElement('li');
                    const button = createButton(item.firstName + " " + item.lastName, 'showInfo(`'+ btoa(item.id) +'`)');
                    const image = createImage('image', '../images/upload/' + item.avatar);

                    const buttonFav = createButton('любими', 'addremoveFav(`'+ btoa(item.id) +'`)');

                    let listPhones = item.phones;

                    if(listPhones != undefined){
                        if(listPhones.length != 0){
                            for(let i = 0; i < listPhones.length; i++ ){
                                addToSearchContact(item.phones[i].phone);
                            }
                        }
                    }

                    li.appendChild(image);
                    li.appendChild(button);
                    li.appendChild(buttonFav);

                    const line = document.createElement('div');
                    line.setAttribute('class', 'lineBtwn');
    
                    document.querySelector('ul').appendChild(li);
                    document.querySelector('ul').appendChild(line);

                })
            }
        })
}

var favorites = [];

// middleware за показване на контактите
function getItemsFavorite() {
    fetch('http://localhost:3000/favorites')
        .then((response) => response.json())
        .then((listItems) => {
            if (listItems && listItems.length !== 0) {
                listItems.map(item => {

                    if(item.isFavorite === "true"){

                        const li = document.createElement('li');
                        const button = createButton(item.firstName + " " + item.lastName, 'showInfoFavorite(`'+ btoa(item.id) +'`)');
                        const image = createImage('image', '../images/upload/' + item.avatar);

                        const buttonFav = createButton('любими', 'addremoveFav(`'+ btoa(item.id) +'`)');

                        favorites.push(item.id);

                        li.appendChild(image);
                        li.appendChild(button);
                        li.appendChild(buttonFav);

                        const line = document.createElement('div');
                        line.setAttribute('class', 'lineBtwn');
        
                        document.getElementById('favoritelist').appendChild(li);
                        document.getElementById('favoritelist').appendChild(line);
                    }

                })
            }
        })
}


function createImage(id, src) {
    const image = document.createElement('img');
    image.setAttribute('id', id);
    image.setAttribute('src', src);

    return image;
}

function createButton(textContent, atribute) {
    const button = document.createElement('button');
    button.textContent = textContent;
    button.setAttribute('onclick', atribute);

    return button;
}