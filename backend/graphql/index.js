import { ApolloServer } from 'apollo-server-express';
import typeDefs from './schema.js';
import { resolvers } from './resolvers.js';

async function createApolloServer(app) {
    const server = new ApolloServer({
        typeDefs,
        resolvers,
    });
    
    await server.start();
    server.applyMiddleware({ app, path: '/graphql' });
    
    return server;
}

export default createApolloServer;