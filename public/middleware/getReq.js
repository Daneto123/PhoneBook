function addAllNumbers(phones) {

    // записване на нови номера
    const NumberOfList1 = document.createElement('tr');
    const count1 = createTd("Номер");
    const NumberType1 = createTd("Дом./Моб.");
    const NumberPhone1 = createTd("Телефонен номер");

    NumberOfList1.append(count1, NumberType1, NumberPhone1);
    document.getElementById('PhoneNumbers').appendChild(NumberOfList1);

    for (let i = 0; i < phones.length; i++) {
        let NumberOfList = document.createElement('tr');
        let count = createTd(i + 1);
        let NumberType = createTd(phones[i].type);
        let NumberPhone = createTd(phones[i].phone);

        NumberOfList.append(count, NumberType, NumberPhone);
        document.getElementById('PhoneNumbers').appendChild(NumberOfList);

    }

}

function createMetaData(txtF, txtL, txtAddress, txtEml) {
    document.getElementById('frstName').textContent = txtF + "   " + txtL;
    document.getElementById('addrst').textContent = txtAddress;
    document.getElementById('eml').textContent = txtEml;
}

function createTd(textContent) {
    let td = document.createElement('td');
    td.textContent = textContent;

    return td;
}

// middleware за показване на информацията на контактите
function getInfoContact(id) {
    fetch('http://localhost:3000/get/contacts/' + atob(id))
        .then((response) => response.json())
        .then((listContacts) => {
            if (listContacts && listContacts.length !== 0) {

                // мета данните
                createMetaData(listContacts.firstName, listContacts.lastName
                                ,listContacts.address, listContacts.email);

                const profilePic = document.getElementById('profileImg');
                profilePic.setAttribute('src', './images/upload/' + listContacts.avatar);

                // създаване на нови бутони
                const buttonAdd = document.getElementById('addP');
                buttonAdd.setAttribute('onclick', 'showAdd()');

                const buttonAddFunc = document.getElementById('addAnotherNumber');
                buttonAddFunc.setAttribute('onclick', 'addNumb(`'+ btoa(listContacts.id) +'`)');
                
                const buttonRem = document.getElementById('remP');
                buttonRem.setAttribute('onclick', 'showRem()');

                const buttonRemFunc = document.getElementById('removeAnotherNumber');
                buttonRemFunc.setAttribute('onclick', 'removeNumb(`'+ btoa(listContacts.id) +'`)');

                const deleteUser = document.getElementById('remPer');
                deleteUser.setAttribute('onclick', 'removeContact(`'+ btoa(listContacts.id) +'`)');


                if(listContacts.phones != undefined){
                    addAllNumbers(listContacts.phones);
                }

            }
        })
}

// middleware за показване на информацията на контактите
function getInfoContactSearch(phone) {

    if(phone != null) {

        fetch('http://localhost:3000/get/contactsSearch/' + phone)
            .then((response) => response.json())
            .then((listContacts) => {
                if (listContacts && listContacts.length !== 0) {

                    // мета данните
                    createMetaData(listContacts.firstName, listContacts.lastName
                        ,listContacts.address, listContacts.email);

                    const profilePic = document.getElementById('profileImg');
                    profilePic.setAttribute('src', './images/upload/' + listContacts.avatar);

                    // създаване на нови бутони
                    const buttonAdd = document.getElementById('addP');
                    buttonAdd.setAttribute('onclick', 'addNumb(`'+ btoa(listContacts.id) +'`)');
                    
                    const buttonRem = document.getElementById('remP');
                    buttonRem.setAttribute('onclick', 'removeNumb(`'+ btoa(listContacts.id) +'`)');

                    const deleteUser = document.getElementById('remPer');
                    deleteUser.setAttribute('onclick', 'removeContact(`'+ btoa(listContacts.id) +'`)');


                    if(listContacts.phones != undefined){
                        addAllNumbers(listContacts.phones);
                    }
                    
                }
            })

    }
}