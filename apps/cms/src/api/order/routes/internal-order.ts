export default { routes: [{ method: 'POST', path: '/internal/orders/sync', handler: 'internal-order.sync', config: { auth: false } }] };
