// проверява за валиден email и телефонен номер
function check(inpEmail, inpPhone) {

    inpEmail.addEventListener("input", function(e) {

        val = this.value;
        let pattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        let message = document.getElementById('message');
        
        if(!val.match(pattern)) {   
            message.textContent = "email is not correct";
            document.getElementById('email').style.border = "1px solid red";
        } else {
            document.getElementById('email').style.border = "1px solid black";
            message.textContent = "";
        }

    });


    inpPhone.addEventListener("input", function(e) {

        val = this.value;
        let pattern = /^\d{9}$/;
        let message = document.getElementById('message');
        
        if(!val.match(pattern)) {   
            message.textContent = "phone is not correct";
            document.getElementById('phone').style.border = "1px solid red";
        } else {
            document.getElementById('phone').style.border = "1px solid black";
            message.textContent = "";
        }

    });


}


check(document.getElementById("email"), document.getElementById("phone"));