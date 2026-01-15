package com.restaurantsaas.order.repository;

import com.restaurantsaas.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByStoreIdOrderByCreatedAtDesc(UUID storeId);
    List<Order> findByStoreIdAndStatusOrderByCreatedAtDesc(UUID storeId, Order.OrderStatus status);
}
