import type { Order, OrderItem } from '../domain/order.js';
import type { OrderRepository } from '../domain/order-repository.js';

export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, Order>();

  public findById(orderId: string): Promise<Order | null> {
    const order = this.orders.get(orderId);

    return Promise.resolve(order === undefined ? null : cloneOrder(order));
  }

  public save(order: Order): Promise<void> {
    this.orders.set(order.id, cloneOrder(order));

    return Promise.resolve();
  }
}

function cloneOrder(order: Order): Order {
  const clonedItems = order.items.map(cloneOrderItem);

  if (order.status === 'CONFIRMED') {
    return {
      createdAt: new Date(order.createdAt),
      customer: {
        email: order.customer.email,
        name: order.customer.name,
      },
      id: order.id,
      items: clonedItems,
      status: order.status,
      total: order.total,
    };
  }

  return {
    createdAt: new Date(order.createdAt),
    customer: {
      email: order.customer.email,
      name: order.customer.name,
    },
    id: order.id,
    items: clonedItems,
    rejectionReason: order.rejectionReason,
    status: order.status,
    total: order.total,
  };
}

function cloneOrderItem(item: OrderItem): OrderItem {
  return {
    id: item.id,
    lineTotal: item.lineTotal,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  };
}
