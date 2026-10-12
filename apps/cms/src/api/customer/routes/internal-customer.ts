export default {
  routes: [
    {
      method: 'POST',
      path: '/internal/customers/sync',
      handler: 'internal-customer.sync',
      config: { auth: false },
    },
    {
      method: 'DELETE',
      path: '/internal/customers/:externalCustomerId',
      handler: 'internal-customer.remove',
      config: { auth: false },
    },
  ],
};
