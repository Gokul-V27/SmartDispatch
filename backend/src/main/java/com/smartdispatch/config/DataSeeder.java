package com.smartdispatch.config;

import com.smartdispatch.entity.*;
import com.smartdispatch.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) return;

        // Seed Admin
        userRepository.save(User.builder()
                .name("Admin User").email("admin@smartdispatch.com")
                .passwordHash(passwordEncoder.encode("admin123"))
                .role(User.Role.ADMIN).phone("+91 9876543210").build());

        // Seed Packer
        userRepository.save(User.builder()
                .name("Ravi Kumar").email("ravi@smartdispatch.com")
                .passwordHash(passwordEncoder.encode("packer123"))
                .role(User.Role.PACKER).workerId("WK-04219")
                .pinHash(passwordEncoder.encode("123456"))
                .phone("+91 9876543211").build());

        // Seed Customer
        User customerUser = userRepository.save(User.builder()
                .name("Mrs. Priya").email("priya@example.com")
                .passwordHash(passwordEncoder.encode("customer123"))
                .role(User.Role.CUSTOMER).phone("+91 9876543212").build());

        // Seed Delivery Person
        userRepository.save(User.builder()
                .name("Suresh Delivery").email("suresh@smartdispatch.com")
                .passwordHash(passwordEncoder.encode("delivery123"))
                .role(User.Role.DELIVERY).workerId("DL-07312")
                .pinHash(passwordEncoder.encode("654321"))
                .phone("+91 9876543213").build());

        // Seed Products
        Product dellLaptop = productRepository.save(Product.builder()
                .sku("SKU-DELL-3520-SLV").name("Dell Inspiron 15").brand("Dell")
                .modelNumber("IN3520-7890").category("Electronics").color("Silver")
                .weightKg(2.5).weightToleranceG(100).price(new BigDecimal("65999"))
                .specs("{\"ram\":\"16GB\",\"storage\":\"512GB SSD\",\"screen\":\"15.6 FHD\"}")
                .imageUrls("https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=600&q=80")
                .description("Dell Inspiron 15 laptop").stockQty(50).build());

        Product logitechMouse = productRepository.save(Product.builder()
                .sku("SKU-LGT-M235-BLK").name("Logitech Mouse M235").brand("Logitech")
                .modelNumber("M235").category("Electronics").color("Black")
                .weightKg(0.35).weightToleranceG(50).price(new BigDecimal("1299"))
                .imageUrls("https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80")
                .description("Wireless mouse").stockQty(200).build());

        Product iphone = productRepository.save(Product.builder()
                .sku("SKU-APL-IP15-BLU").name("iPhone 15").brand("Apple")
                .modelNumber("A2846").category("Electronics").color("Blue")
                .weightKg(0.171).weightToleranceG(20).price(new BigDecimal("79999"))
                .specs("{\"storage\":\"128GB\",\"chip\":\"A16 Bionic\"}")
                .imageUrls("https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80")
                .description("Apple iPhone 15").stockQty(30).build());

        // More Products
        Product apex = productRepository.save(Product.builder()
                .sku("SKU-APX-TOOL").name("Apex Heavy Duty Toolbox").brand("Apex")
                .modelNumber("APX-TB-99").category("Hardware").color("Orange")
                .weightKg(4.2).weightToleranceG(200).price(new BigDecimal("3499"))
                .imageUrls("https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=600&q=80")
                .description("Steel latch industrial grade toolbox").stockQty(25).build());

        Product chair = productRepository.save(Product.builder()
                .sku("SKU-SIH-CHAIR").name("Premium Leather Ergonomic Chair").brand("Sihoo")
                .modelNumber("SIH-M57-L").category("Furniture").color("Black")
                .weightKg(18.5).weightToleranceG(500).price(new BigDecimal("12900"))
                .imageUrls("https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&w=600&q=80")
                .description("Full grain leather high back executive chair").stockQty(8).build());

        Product jacket = productRepository.save(Product.builder()
                .sku("SKU-TIM-JKT").name("Waterproof Canvas Field Jacket").brand("Timberland")
                .modelNumber("TIM-FJ-02").category("Clothing").color("Green")
                .weightKg(0.95).weightToleranceG(30).price(new BigDecimal("5299"))
                .imageUrls("https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80")
                .description("Ultra-durable military standard heavy-weave canvas jacket").stockQty(60).build());

        User packerAnish = userRepository.save(User.builder()
                .name("Anish Nair").email("anish@smartdispatch.com")
                .passwordHash(passwordEncoder.encode("packer123"))
                .role(User.Role.PACKER).workerId("WK-04220")
                .pinHash(passwordEncoder.encode("112233"))
                .phone("+91 9447382103").build());

        User packerSiddharth = userRepository.save(User.builder()
                .name("Siddharth Rao").email("sid.rao@smartdispatch.com")
                .passwordHash(passwordEncoder.encode("packer123"))
                .role(User.Role.PACKER).workerId("WK-01822")
                .pinHash(passwordEncoder.encode("223344"))
                .phone("+91 9885432109").build());

        User supervisorPooja = userRepository.save(User.builder()
                .name("Pooja Sharma").email("pooja.sharma@smartdispatch.com")
                .passwordHash(passwordEncoder.encode("admin123"))
                .role(User.Role.ADMIN) // Treat Supervisor as Admin for now
                .phone("+91 8129347568").build());

        // Seed Orders
        String addressJson = "{\"recipientName\":\"Mrs. Priya\",\"phone\":\"+91 9876543212\",\"addressLine1\":\"123 Main St\",\"city\":\"Bangalore\",\"state\":\"Karnataka\",\"pinCode\":\"560001\"}";

        Order order1 = Order.builder()
                .orderNumber("ORD-2024-8821")
                .customer(customerUser)
                .status(Order.OrderStatus.PENDING)
                .totalAmount(new BigDecimal("67298"))
                .shippingAddress(addressJson)
                .build();
        
        OrderItem item1 = OrderItem.builder().order(order1).product(dellLaptop).quantity(1).build();
        OrderItem item2 = OrderItem.builder().order(order1).product(logitechMouse).quantity(1).build();
        order1.setItems(java.util.List.of(item1, item2));
        orderRepository.save(order1);

        Order order2 = Order.builder()
                .orderNumber("ORD-2024-8822")
                .customer(customerUser)
                .packer(packerAnish)
                .status(Order.OrderStatus.PACKING)
                .totalAmount(new BigDecimal("79999"))
                .shippingAddress(addressJson)
                .build();
        
        OrderItem item3 = OrderItem.builder().order(order2).product(iphone).quantity(1).build();
        order2.setItems(java.util.List.of(item3));
        orderRepository.save(order2);

        Order order3 = Order.builder()
                .orderNumber("ORD-2024-8823")
                .customer(customerUser)
                .status(Order.OrderStatus.DELIVERED)
                .totalAmount(new BigDecimal("12900"))
                .shippingAddress(addressJson)
                .build();
        
        OrderItem item4 = OrderItem.builder().order(order3).product(chair).quantity(1).build();
        order3.setItems(java.util.List.of(item4));
        orderRepository.save(order3);

        System.out.println("✅ Seed data loaded: comprehensive dataset.");
    }
}
