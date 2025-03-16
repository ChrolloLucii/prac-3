import express from 'express';
import * as swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import createApolloServer from './graphql/index.js';
import { resolvers, products } from './graphql/resolvers.js';
import cors from 'cors';
import {createServer} from 'http';
import {Server as SocketIO} from 'socket.io';

const app = express();
const port = 4000;
const swaggerDocument = YAML.load('./swagger.yaml');

const httpServer = createServer(app);
const io = new SocketIO(httpServer, {
    cors: {
        origin: '*',  
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const chatMessages = [];

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    
    socket.on('get chat history', () => {
        socket.emit('chat history', chatMessages);
    });
    
   
    socket.emit('chat history', chatMessages);

    socket.on('chat message', (msg) => {
        console.log('Получено сообщение:', msg);

        const messageWithTimestamp = {
            ...msg,
            timestamp: new Date().toISOString()
        };
        chatMessages.push(messageWithTimestamp);
        io.emit('chat message', messageWithTimestamp);
    });
    
    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});
async function startServer() {
    await createApolloServer(app);

    app.get('/products', (req, res) => {
        res.json(products);
    });
    
    app.get('/products/:id', (req, res) => {
        const id = parseInt(req.params.id);
        const product = products.find(p => p.id === id);
        if (!product) {
            return res.status(404).send('Product not found');
        }
        res.json(product);
    });

    app.post('/products', (req, res) => {
        const { name, price, description, categories } = req.body;
        const newProduct = {
            id: products.length + 1,
            name,
            price,
            description,
            categories: Array.isArray(categories) ? categories : [categories]
        };
        products.push(newProduct);
        res.status(201).json(newProduct);
    });

    app.put('/products/:id', (req, res) => {
        const id = parseInt(req.params.id);
        const index = products.findIndex(p => p.id === id);
        if (index === -1) {
            return res.status(404).send('Product not found');
        }
        const { name, price, description, categories } = req.body;
        products[index] = {
            ...products[index],
            name: name || products[index].name,
            price: price || products[index].price,
            description: description || products[index].description,
            categories: categories ? (Array.isArray(categories) ? categories : [categories]) : products[index].categories
        };
        res.json(products[index]);
    });
    
    app.delete('/products/:id', (req, res) => {
        const id = parseInt(req.params.id);
        const index = products.findIndex(p => p.id === id);
        if (index === -1) {
            return res.status(404).send('Product not found');
        }
        const deleted = products.splice(index, 1);
        res.json(deleted[0]);
    });
    
    httpServer.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
        console.log(`GraphQL server is running on http://localhost:${port}/graphql`);
        console.log(`websoket server is running on http://localhost:${port}`);
    });
}
startServer().catch(err => {
    console.error('Failed to start the server:', err);
});