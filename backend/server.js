const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

const app = express();
const port = 4000;


app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

let products = [
    {id : 1, name : 'product 1', price : 100, description: "description1", categories: ['categoryA']},
    {id : 2, name : 'product 2', price : 200, description: "description2", categories: ['categoryB']},
    {id : 3, name : 'product 3', price : 300, description: "description3", categories: ['categoryA', 'categoryB']},
    {id : 4, name : 'product 4', price : 400, description: "description4", categories: ['categoryA']},
    {id : 5, name : 'product 5', price : 500, description: "description5", categories: ['categoryB']}
]

app.get('/products', (req, res) => {
    res.json(products);
}
);

app.get('/products/:id', (req, res)=>
{
    const id = parseInt(req.params.id);
    const product = products.find(p =>p.id === id);
    if (product){
        res.json(product);
    }
    else{
        res.status(404).send('Product not found');
    }
}
);

app.post('/products', (req, res) => {
    const {name, price, description, categories} = req.body;
    const newProcuduct = {
        id : products.length+1,
        name,
        price,
        description,
        categories : Array.isArray(categories) ? categories : {categories}
    };
    products.push(newProcuduct);
    res.status(201).json(newProcuduct);
});

app.put('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p=> p.id===id);
    if (index !== -1){

        const { name, price, description, categories} = req.body;
    products[index] ={
        ...products[index],
        name : name || products[index].name,
        price : price || products[index].price,
        description : description || products[index].description,
        categories : categories ? (Array.isArray(categories) ? categories : [categories]) : products[index].categories
    };
    res.json(products[index])
}
    else{
        res.status(404).send('Product not found');
    }

});
app.delete('/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p=>p.id === id);
    if (index !== -1) {
        const deleted = products.slice(index, 1);
        res.json(deleted[0]);
    }
    else {
        res.status(404).send('Product not found');
    }
})

app.listen(port, ()=>{

    console.log(`Server is running on http://localhost:${port}`);
})