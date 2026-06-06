package com.smartdispatch.repository;

import com.smartdispatch.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    Optional<Order> findByOrderNumber(String orderNumber);
    List<Order> findByCustomerId(UUID customerId);
    List<Order> findByPackerId(UUID packerId);
    List<Order> findByStatus(Order.OrderStatus status);
    List<Order> findByStatusIn(List<Order.OrderStatus> statuses);
}
