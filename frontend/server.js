import express from 'express';
import axios from 'axios';
import { gql, request } from 'graphql-request';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import { io as SocketIOClient } from 'socket.io-client';

const app = express();
const httpServer = createServer(app);
const port = 3000;


const io = new SocketIO(httpServer);


const backendSocket = SocketIOClient('http://localhost:4000');


backendSocket.on('chat message', (msg) => {

  io.emit('chat message', msg);
});

backendSocket.on('chat history', (messages) => {

  io.emit('chat history', messages);
});


io.on('connection', (socket) => {
  console.log('Клиент подключился к фронтенду:', socket.id);


  backendSocket.emit('get chat history');


  socket.on('chat message', (msg) => {
    backendSocket.emit('chat message', msg);
  });

  socket.on('disconnect', () => {
    console.log('Клиент отключился от фронтенда:', socket.id);
  });
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

const apiBaseUrl = 'http://localhost:4000';
const graphqlEndpoint = 'http://localhost:4000/graphql';



function generateCustomerPageHTML(products, selectedFields) {
  let productsHtml = '';
  let filterForm = '';
  
  if (products && products.length > 0) {
    productsHtml = products.map(product => `
      <div class="product-card">
        <h2>${product.name}</h2>
        <p><strong>Цена:</strong> ${product.price} руб.</p>
        <p><strong>Описание:</strong> ${product.description || 'Нет описания'}</p>
        <p><strong>Категории:</strong> ${Array.isArray(product.categories) ? product.categories.join(', ') : 'Нет категорий'}</p>
      </div>
    `).join('');
  }
  
  const chatInterface = `
    <div class="chat-container">
      <h2>Чат с поддержкой</h2>
      <div id="chat-messages" class="chat-messages"></div>
      <div class="chat-input-container">
        <input type="text" id="chat-input" placeholder="Введите сообщение...">
        <button id="send-button">Отправить</button>
      </div>
    </div>
    
    <script src="/socket.io/socket.io.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function() {

        const socket = io();
        const username = 'Покупатель_' + Math.floor(Math.random() * 1000);
        
  
        socket.on('chat history', (messages) => {
          const chatMessages = document.getElementById('chat-messages');
          chatMessages.innerHTML = '';
          
          if (messages && Array.isArray(messages)) {
            messages.forEach(msg => {
              addMessageToChat(msg);
            });
          }
          chatMessages.scrollTop = chatMessages.scrollHeight;
        });
        
       
        socket.on('chat message', (msg) => {
          addMessageToChat(msg);
          const chatMessages = document.getElementById('chat-messages');
          chatMessages.scrollTop = chatMessages.scrollHeight;
        });
        
       
        function sendMessage() {
          const messageInput = document.getElementById('chat-input');
          const message = messageInput.value.trim();
          
          if (message) {
         
            socket.emit('chat message', {
              username: username,
              text: message,
              role: 'customer'
            });
            messageInput.value = '';
          }
        }
        
       
        function addMessageToChat(msg) {
          const chatMessages = document.getElementById('chat-messages');
          const messageDiv = document.createElement('div');
          
          messageDiv.className = msg.role === 'admin' ? 'message admin-message' : 'message customer-message';
          
          const time = new Date(msg.timestamp || Date.now()).toLocaleTimeString();
          messageDiv.innerHTML = \`<strong>\${msg.username || 'Пользователь'}</strong> <span class="time">[\${time}]</span>: \${msg.text}\`;
          
          chatMessages.appendChild(messageDiv);
        }
        
        
        document.getElementById('send-button').addEventListener('click', sendMessage);
        
        document.getElementById('chat-input').addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            sendMessage();
          }
        });
      });
    </script>
  `;

  return `
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Магазин - Каталог товаров</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; }
          h1 { color: #4a4a4a; }
          .search-container { margin: 20px 0; }
          .field-selection { margin: 20px 0; padding: 10px; background-color: #f9f9f9; border-radius: 5px; }
          .product-card { border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
          .admin-link { display: inline-block; margin: 20px 0; padding: 10px 15px; background-color: #2c3e50; color: white; text-decoration: none; border-radius: 5px; }
          
          /* Стили чата */
          .chat-container { border: 1px solid #ddd; border-radius: 5px; margin-top: 30px; padding: 10px; }
          .chat-messages { height: 300px; overflow-y: auto; border: 1px solid #eee; padding: 10px; margin-bottom: 10px; }
          .chat-input-container { display: flex; }
          .chat-input-container input { flex-grow: 1; padding: 5px; margin-right: 5px; }
          .message { margin-bottom: 8px; padding: 5px; border-radius: 5px; }
          .admin-message { background-color: #f0f0f0; }
          .customer-message { background-color: #e1f5fe; }
          .time { color: #777; font-size: 0.8em; }
        </style>
      </head>
      <body>
        <h1>Каталог товаров (GraphQL API)</h1>
        <p>Используется GraphQL для получения только нужных полей</p>
        ${filterForm}
        <div class="products-container">
          ${products.length > 0 ? productsHtml : '<p>Товары не найдены</p>'}
        </div>
        ${chatInterface}
      </body>
    </html>
  `;
}

function generateAdminPageHTML(products) {
  let productsHtml = '';

  products.forEach(product => {
    productsHtml += `
      <div class="product-item">
        <h2>${product.name}</h2>
        <p><strong>ID:</strong> ${product.id}</p>
        <p><strong>Цена:</strong> ${product.price} руб.</p>
        <p><strong>Описание:</strong> ${product.description}</p>
        <p><strong>Категории:</strong> ${Array.isArray(product.categories) ? product.categories.join(', ') : product.categories}</p>
        
        <div class="admin-actions">
          <button onclick="showEditForm(${product.id}, '${product.name}', ${product.price}, '${product.description}', '${Array.isArray(product.categories) ? product.categories.join(',') : product.categories}')">Редактировать</button>
          
          <form method="post" action="/admin/products/${product.id}/delete" style="display:inline;">
            <button type="submit" onclick="return confirm('Вы уверены, что хотите удалить этот товар?')">Удалить</button>
          </form>
        </div>
        
        <div id="edit-form-${product.id}" class="edit-form" style="display:none;">
          <h3>Редактировать товар</h3>
          <form method="post" action="/admin/products/${product.id}/update">
            <div>
              <label>Название:</label>
              <input type="text" name="name" id="edit-name-${product.id}" value="${product.name}">
            </div>
            <div>
              <label>Цена:</label>
              <input type="number" name="price" id="edit-price-${product.id}" value="${product.price}">
            </div>
            <div>
              <label>Описание:</label>
              <textarea name="description" id="edit-desc-${product.id}">${product.description}</textarea>
            </div>
            <div>
              <label>Категории (через запятую):</label>
              <input type="text" name="categories" id="edit-cat-${product.id}" value="${Array.isArray(product.categories) ? product.categories.join(',') : product.categories}">
            </div>
            <button type="submit">Сохранить</button>
            <button type="button" onclick="hideEditForm(${product.id})">Отмена</button>
          </form>
        </div>
      </div>
    `;
  });

  const addProductForm = `
    <div class="add-product-form">
      <h2>Добавить новый товар</h2>
      <form method="post" action="/admin/products">
        <div>
          <label>Название:</label>
          <input type="text" name="name" required>
        </div>
        <div>
          <label>Цена:</label>
          <input type="number" name="price" required>
        </div>
        <div>
          <label>Описание:</label>
          <textarea name="description"></textarea>
        </div>
        <div>
          <label>Категории (через запятую):</label>
          <input type="text" name="categories">
        </div>
        <button type="submit">Добавить товар</button>
      </form>
    </div>
  `;

  const adminChatInterface = `
  <div class="chat-container">
    <h2>Чат с покупателями</h2>
    <div id="chat-messages" class="chat-messages"></div>
    <div class="chat-input-container">
      <input type="text" id="chat-input" placeholder="Введите сообщение...">
      <button id="send-button">Отправить</button>
    </div>
  </div>
  
  <script src="/socket.io/socket.io.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
    
      const socket = io();
      const username = 'Администратор';
      
    
      socket.on('chat history', (messages) => {
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';
        
        if (messages && Array.isArray(messages)) {
          messages.forEach(msg => {
            addMessageToChat(msg);
          });
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
      });
      
   
      socket.on('chat message', (msg) => {
        addMessageToChat(msg);
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
      });
      
     
      function sendMessage() {
        const messageInput = document.getElementById('chat-input');
        const message = messageInput.value.trim();
        
        if (message) {
        
          socket.emit('chat message', {
            username: username,
            text: message,
            role: 'admin'
          });
          messageInput.value = '';
        }
      }
      
      
      function addMessageToChat(msg) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        
        messageDiv.className = msg.role === 'admin' ? 'message admin-message' : 'message customer-message';
        
        const time = new Date(msg.timestamp || Date.now()).toLocaleTimeString();
        messageDiv.innerHTML = \`<strong>\${msg.username || 'Пользователь'}</strong> <span class="time">[\${time}]</span>: \${msg.text}\`;
        
        chatMessages.appendChild(messageDiv);
      }
      
     
      document.getElementById('send-button').addEventListener('click', sendMessage);
      
      document.getElementById('chat-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          sendMessage();
        }
      });
    });
  </script>
`;

  return `
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Админ-панель</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; }
          h1 { color: #2c3e50; }
          .product-item { border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 5px; }
          .admin-actions { margin-top: 10px; }
          .add-product-form { background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .edit-form { background-color: #f0f0f0; padding: 15px; margin-top: 10px; border-radius: 5px; }
          input, textarea { width: 100%; padding: 8px; margin: 5px 0 15px; }
          button { padding: 8px 15px; margin-right: 5px; cursor: pointer; }
          .back-link { display: inline-block; margin: 20px 0; padding: 10px 15px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; }
          
          /* Стили чата */
          .chat-container { border: 1px solid #ddd; border-radius: 5px; margin-top: 30px; padding: 10px; }
          .chat-messages { height: 300px; overflow-y: auto; border: 1px solid #eee; padding: 10px; margin-bottom: 10px; }
          .chat-input-container { display: flex; }
          .chat-input-container input { flex-grow: 1; padding: 5px; margin-right: 5px; }
          .message { margin-bottom: 8px; padding: 5px; border-radius: 5px; }
          .admin-message { background-color: #e6f7ff; }
          .customer-message { background-color: #f9f9f9; }
          .time { color: #777; font-size: 0.8em; }
        </style>
        <script>
          function showEditForm(id, name, price, desc, cats) {
            document.getElementById('edit-form-' + id).style.display = 'block';
            document.getElementById('edit-name-' + id).value = name;
            document.getElementById('edit-price-' + id).value = price;
            document.getElementById('edit-desc-' + id).value = desc;
            document.getElementById('edit-cat-' + id).value = cats;
          }
          
          function hideEditForm(id) {
            document.getElementById('edit-form-' + id).style.display = 'none';
          }
        </script>
      </head>
      <body>
        <h1>Админ-панель управления товарами (REST API)</h1>
        <p>Используется REST API для управления товарами</p>
        <a href="/" class="back-link">Вернуться на страницу покупателя</a>
        ${addProductForm}
        <h2>Список товаров</h2>
        ${products.length > 0 ? productsHtml : '<p>Товары не найдены</p>'}
        ${adminChatInterface}
      </body>
    </html>
  `;
}


app.get('/', async (req, res) => {
  try {

    const response = await axios.get(`${apiBaseUrl}/products`);
    const products = response.data;
    
    const html = generateCustomerPageHTML(products);
    res.send(html);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Error loading products');
  }
});

app.get('/admin', async (req, res) => {
  try {

    const response = await axios.get(`${apiBaseUrl}/products`);
    const products = response.data;
    
 
    const html = generateAdminPageHTML(products);
    res.send(html);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).send('Error loading admin page');
  }
});


app.post('/admin/products/:id/update', async (req, res) => {
  try {
    const id = req.params.id;
    await axios.put(`${apiBaseUrl}/products/${id}`, req.body);
    res.redirect('/admin');
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).send('Error updating product');
  }
});

app.post('/admin/products/:id/delete', async (req, res) => {
  try {
    const id = req.params.id;
    await axios.delete(`${apiBaseUrl}/products/${id}`);
    res.redirect('/admin');
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).send('Error deleting product');
  }
});


app.post('/admin/products', async (req, res) => {
  try {
    await axios.post(`${apiBaseUrl}/products`, req.body);
    res.redirect('/admin');
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).send('Error adding product');
  }
});
  
httpServer.listen(port, () => {
  console.log(`Frontend server is running on http://localhost:${port}`);
});