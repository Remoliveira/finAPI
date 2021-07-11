const { request, response } = require('express');
const express = require('express');
const { v4:uuidv4 } = require('uuid')
const app = express();
app.use(express.json());

const customers = [];

function isThereASccount(request,response,next){

    const { cpf } = request.headers;

    const customer = customers.find((customer) => customer.cpf === cpf);
    if(!customer){
        return response.status(400).json({message:"error: customer not found"});
    }

    request.customer = customer;
    return next();
}

function getBalance(statement){

    const balance = statement.reduce((acc,operation)=>{
        if(operation.type === 'credit'){
            return acc + operation.amount;
        }else{
            return acc - operation.amount;
        }
    },0)
    return balance;

}

app.post("/account",(request,response)=>{

    const { cpf, name } = request.body;
   
    const checkCustomer = customers.some(
        (customer)=> customer.cpf === cpf     
    );
    

    if(checkCustomer){
        return response.status(400).json({error:"Customer alredy exists"})
    }

    customers.push({
        cpf,
        name,
        id:uuidv4(),
        statement:[]})

    return response.status(201).send("Register check")
   
});
// app.use(isThereASccount);
app.get("/statement",isThereASccount,(request,response)=>{
    ///    /statement/:cpf
    // const { cpf } = request.params;
    const { customer } = request;
    return response.json(customer.statement);
    

});

app.post("/deposit",isThereASccount,(request,response)=>{
    const { description, amount } = request.body;

    const { customer } = request;

    // console.log(amount)
    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type:"credit"
    }
    customer.statement.push(statementOperation);
    return response.status(200).send()
});

app.post("/withdraw",isThereASccount,(request,response)=>{

    const { amount } = request.body;

    const { customer } = request;

    const balance = getBalance(customer.statement);
    if(balance < amount){
        return response.status(400).json({"message":"Insufficient founds"})
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type:"debit"     
    }
    customer.statement.push(statementOperation);

    return response.status(201).send()
});

app.get("/statement/date",isThereASccount,(request,response)=>{

    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " 00:00")

    const statement = customer.statement.filter((statement)=>

         statement.created_at.toDateString() === new Date(dateFormat).toDateString()
    )
    return response.json(statement)


});

app.put("/account",isThereASccount,(request,response)=>{

    const name = request.body.name;
    const customer = request.customer;

    customer.name = name;

    response.status(201).json({"message":"New name is "+name})
});

app.get("/account",isThereASccount,(request,response)=>{

    const { customer } = request;
    return response.json(customer)
});

app.delete("/account", isThereASccount, (request,response)=>{

    const customer = request.customer;

    customers.splice(customer,1);

    response.status(200).json(customers)
});


app.get("/accounts", (request,response)=>{

    response.status(200).json(customers)
});

app.get("/balance",isThereASccount,(request,response)=>{

    const { customer } = request;

    const balance = getBalance(customer.statement);
    return response.json(balance)

})
app.listen(3333)