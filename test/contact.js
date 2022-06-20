const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../index');

chai.should();
chai.use(chaiHttp);

describe('Test App', () => {

    /**
     * get all contacts
     */
    describe("GET /contacts", () => {
        it("It should GET all contacts", (done) => {
            chai.request(server)
                .get("/contacts")
                .end((err, response) => {
                    response.should.have.status(200);
                    response.body.should.be.a('array');
                    response.body.length.should.be.eq(1);
                done();
                });
        });

    });

    /**
     * test get by id
     */
    describe("GET /get/contacts/:id", () => {
        it("It should GET a task by ID", (done) => {
            const id = "379b2b7b-90c7-4edd-bd5f-86e76849e768";
            chai.request(server)                
                .get("/get/contacts/" + id)
                .end((err, response) => {
                    response.should.have.status(200);
                    response.body.should.be.a('object');
                    response.body.should.have.property('id');
                    response.body.should.have.property('firstName');
                    response.body.should.have.property('lastName');
                    response.body.should.have.property('address');
                    response.body.should.have.property('email');
                    //response.body.should.have.property('phones');
                    response.body.should.have.property('avatar');
                    response.body.should.have.property('id').eq("379b2b7b-90c7-4edd-bd5f-86e76849e768");
                done();
                });
        });

        it("It should NOT GET a task by ID", (done) => {
            setTimeout(done, 300);
            const id ="379b2b7b-90c7-4edd-86e76849e768";
            chai.request(server)                
                .get("/get/contacts/" + id)
                .end((err, response) => {
                    response.should.have.status(404);
                done();
                });
        });

    });

    /**
     * create new contact
     */
    describe("POST /contacts", () => {
        it("It should POST a new contact", (done) => {
            const contact = {
                firstName: "deyvid",
                lastName: "adzhemiev",
                address: "balgoevgrad",
                email: "deyvid@email.com",
                phones: [{type:"мобилен", phone: "890844557"}] 
            };
            chai.request(server)                
                .post("/contacts")
                .send(contact)
                .end((err, response) => {
                    response.should.have.status(201);
                    response.body.should.be.a('object');
                    response.body.should.have.property('firstName').eq("deyvid");
                    response.body.should.have.property('lastName').eq("adzhemiev");
                    response.body.should.have.property('address').eq("balgoevgrad");
                    response.body.should.have.property('email').eq("deyvid@email.com");
                    response.body.should.have.property('phones').be.a('array');
                done();
                });
        });

        it("It should NOT POST a new contact without the name property", (done) => {
            const task = {
                address: "balgoevgrad",
                email: "deyvid@email.com",
            };
            chai.request(server)                
                .post("/contacts")
                .send(task)
                .end((err, response) => {
                    response.should.have.status(404);
                done();
                });
        });

    });


    /**
     * remove contact
     */
     describe("DELETE /remove/contacts/:id", () => {
        it("It should DELETE an existing task", (done) => {
            setTimeout(done, 300);
            const id = 45;
            chai.request(server)                
                .delete("/remove/contacts/" + id)
                .end((err, response) => {
                    response.should.have.status(200);
                done();
                });
        });

        it("It should NOT DELETE a task that is not in the database", (done) => {
            setTimeout(done, 300);
            const id = 145;
            chai.request(server)                
                .delete("/remove/contacts/" + id)
                .end((err, response) => {
                    response.should.have.status(404);
                    response.text.should.be.eq("id does not exist.");
                done();
                });
        });

    });


    /**
     * add new phoneNumber
     */
     describe("PATCH /changeNumber/contactsPhone/:id", () => {
        it("It should PATCH an existing contact, add new phone number", (done) => {
            const id = "379b2b7b-90c7-4edd-bd5f-86e76849e768";
            const newPhone = {  
                type: "мобилен",
                phone: "898453555" 
            };
            chai.request(server)                
                .patch("/changeNumber/contactsPhone/" + id)
                .send(newPhone)
                .end((err, response) => {
                    response.should.have.status(200);
                done();
                });
        });

        it("It should NOT PATCH an existing contact without phone number", (done) => {
            const id = "379b2b7b-90c7-4edd-bd5f-86e76849e768";
            const newPhone = {
                type: "мобилен"
            };
            chai.request(server)                
                .patch("/changeNumber/contactsPhone/" + id)
                .send(newPhone)
                .end((err, response) => {
                    response.should.have.status(400);
                    response.text.should.be.eq({error: "Invalid data" });
                done();
                });
        });        
    });


    /**
     * remove phoneNumber
     */
     describe("DELETE /contactsPhone/:id", () => {
        it("It should DELETE an existing phone number", (done) => {
            const id = "379b2b7b-90c7-4edd-bd5f-86e76849e768";
            const phoneDelete = {
                phone: "898453555"
            };
            chai.request(server)                
                .delete("/contactsPhone/" + id)
                .send(phoneDelete)
                .end((err, response) => {
                    response.should.have.status(200);
                done();
                });
        });

        it("It should NOT DELETE phone number", (done) => {
            const id = "379b2b7b-bd5f-86e76849e768";
            chai.request(server)                
                .delete("/contactsPhone/" + id)
                .end((err, response) => {
                    response.should.have.status(404);
                done();
                });
        });

    });



})