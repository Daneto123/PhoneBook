// добавяне на нов телефонен номер
function submitAtnoherPhone(id){

    const typenumber = document.getElementById("typeNumb").value;
    const phoneNumber = document.getElementById("phoneNumbAdd").value;

    console.log(typenumber + "are we zashto ne vliza tuk" + phoneNumber);

    fetch('http://localhost:3000/changeNumber/contactsPhone/' + atob(id), {
        method: 'PATCH',
        body: JSON.stringify({  type: typenumber,
                                phone: phoneNumber }),

        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })
        .then((response) => response.json())
        .then((result) => console.log(result))

}

// добавяне на потребител в списъка с любими
function addToFav(id, isFavv){

    fetch('http://localhost:3000/fav/favorite/' + id, {
        method: 'PATCH',
        body: JSON.stringify({  isFav: isFavv }),

        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })
        .then((response) => response.json())
        .then((result) => console.log(result))

}