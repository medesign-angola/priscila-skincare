export default {
  routes: [
    {
      method: 'POST',
      path: '/internal/reviews/sync',
      handler: 'internal-review.sync',
      config: { auth: false },
    },
  ],
};
