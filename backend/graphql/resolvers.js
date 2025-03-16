let products = [
    {id: 1, name: 'Product 1', price: 100, description: 'Description 1', categories: ['CategoryA']},
    {id: 2, name: 'Product 2', price: 200, description: 'Description 2', categories: ['CategoryB']},
    {id: 3, name: 'Product 3', price: 300, description: 'Description 3', categories: ['CategoryA', 'CategoryB']},
    {id: 4, name: 'Product 4', price: 400, description: 'Description 4', categories: ['CategoryA']},
    {id: 5, name: 'Product 5', price: 500, description: 'Description 5', categories: ['CategoryB']}
];

const resolvers = {
    Query: {
        products: () => products,
        product: (_, {id}) => products.find(p => p.id === parseInt(id)),
        productsByName: (_, {name}) => products.filter(p => p.name.toLowerCase().includes(name.toLowerCase())),
        productsByIds: (_, {ids}) => products.filter(p => ids.includes(p.id.toString())),
        productsByPriceRange: (_, {min, max}) => products.filter(p => p.price >= min && p.price <= max)
    }   
};

export { resolvers, products };