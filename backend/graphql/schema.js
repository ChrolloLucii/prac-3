import {gql} from 'apollo-server-express';

const typeDefs = gql`
    type Product {
        id: ID!
        name: String!
        price: Float!
        description: String
        categories: [String]
    }
    type Query {
        products: [Product]
        product(id: ID!): Product
        productsByName(name: String!): [Product]
        productsByIds(ids: [ID]!): [Product]
        productsByPriceRange(min: Float!, max: Float!): [Product]
    }
`;
export default typeDefs;