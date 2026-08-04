export default {
  routes: [
    {
      method: 'POST',
      path: '/internal/customers/sync',
      handler: 'internal-customer.sync',
      config: { auth: false },
    },
  ],
};
