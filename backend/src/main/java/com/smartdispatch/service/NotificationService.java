package com.smartdispatch.service;

import com.smartdispatch.entity.Order;
import com.smartdispatch.entity.OrderEvent;
import com.smartdispatch.repository.OrderEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final OrderEventRepository orderEventRepository;

    private static final Map<Order.OrderStatus, String> STATUS_MESSAGES = Map.of(
            Order.OrderStatus.PACKED, "Your order %s has been packed and is ready for dispatch.",
            Order.OrderStatus.LABEL_PRINTED, "Shipping label printed. Your order %s will be dispatched soon.",
            Order.OrderStatus.SHIPPED, "Your order %s is on its way! Track it online.",
            Order.OrderStatus.IN_TRANSIT, "Your order %s is out for delivery today.",
            Order.OrderStatus.DELIVERED, "Your order %s has been delivered. Thank you!"
    );

    public void notifyClient(Order order, Order.OrderStatus newStatus) {
        String template = STATUS_MESSAGES.get(newStatus);
        if (template == null) return; // No notification for this state

        String message = String.format(template, order.getOrderNumber());

        // 1. Log to order_events table
        OrderEvent event = OrderEvent.builder()
                .order(order)
                .status(newStatus.name())
                .message(message)
                .build();
        orderEventRepository.save(event);

        // 2. Console log the notification message
        log.info("----------------------------------------------------------");
        log.info("📧 NOTIFICATION TO CLIENT: {}", order.getCustomer().getEmail());
        log.info("📱 SMS TO CLIENT: {}", order.getCustomer().getPhone());
        log.info("💬 MESSAGE: {}", message);
        log.info("----------------------------------------------------------");

        // 3. (Future) Send email via JavaMailSender
        // 4. (Future) Send SMS via Twilio Java SDK
    }
}
