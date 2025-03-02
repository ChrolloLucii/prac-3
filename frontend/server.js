const express = require("express");
const axios = require('axios');

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));


app.get('/', async (req, res) => {
  
    const { id, category } = req.query;
    const apiBaseUrl = 'http://localhost:4000'; 
  
    try {
      if (id) {
        
        const response = await axios.get(`${apiBaseUrl}/products/${id}`);
        return res.send(renderPage([response.data]));
      } else {
        const response = await axios.get(`${apiBaseUrl}/products`);
        let products = response.data;
        return res.send(renderPage(products));
    }
    } catch (error) {
      console.error(error);
      return res.send(`<html><body><h1>Ошибка при получении товаров</h1></body></html>`);
    }
  });



  function renderPage(products){
    let productsHtml = '';
    products.forEach(product => {
      productsHtml += `
      <div style = "border: 1px solid #ccc; padding: 10px; margin: 10px;">
      <h2>${product.name}</h2>
      <p><strong>Цена:</strong> ${product.price} руб.</p>
      <p><strong>Описание:</strong> ${product.description}</p>
      <p><strong>Категории:</strong> ${product.categories.join(', ')}</p>
      </div>
      `;
    });
      const filterForm = ` 
      <form method = "get" action ="/">
      <div>
        <label> Поиск по id</label>
        <input type="number" name="id" placeholder="ID товара">
        button type="submit">Найти</button>
      </div>
      </form> 
      `;
    return `
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Магазин - Список товаров</title>
      </head>
      <body>
        <h1>Список товаров</h1>
        ${filterForm}
        ${productsHtml}
      </body>
    </html>
  `;
  }


  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  }
    );
    