// премахване на нов телефонен номер
function removePhoneNumber(id){

    const phoneNumber = document.getElementById("phoneNumbRem").value;

    fetch('/changeNumber/contactsPhone/' + atob(id), {
        method: 'DELETE',
        body: JSON.stringify({ phone: phoneNumber }),
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })
        .then((response) => response.json())
        .then((result) => console.log(result))

}

// премахване на нов телефонен номер
function removeContactById(id){

    fetch('/remove/contacts/' + atob(id), {
        method: 'DELETE',
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })
        .then((response) => response.json())
        .then((result) => console.log(result))

}