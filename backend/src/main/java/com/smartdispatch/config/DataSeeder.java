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
        userRepository.save(User.builder()
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
        productRepository.save(Product.builder()
                .sku("SKU-DELL-3520-SLV").name("Dell Inspiron 15").brand("Dell")
                .modelNumber("IN3520-7890").category("Electronics").color("Silver")
                .weightKg(2.5).weightToleranceG(100).price(new BigDecimal("65999"))
                .specs("{\"ram\":\"16GB\",\"storage\":\"512GB SSD\",\"screen\":\"15.6 FHD\"}")
                .description("Dell Inspiron 15 laptop").stockQty(50).build());

        productRepository.save(Product.builder()
                .sku("SKU-LGT-M235-BLK").name("Logitech Mouse M235").brand("Logitech")
                .modelNumber("M235").category("Electronics").color("Black")
                .weightKg(0.35).weightToleranceG(50).price(new BigDecimal("1299"))
                .description("Wireless mouse").stockQty(200).build());

        productRepository.save(Product.builder()
                .sku("SKU-APL-IP15-BLU").name("iPhone 15").brand("Apple")
                .modelNumber("A2846").category("Electronics").color("Blue")
                .weightKg(0.171).weightToleranceG(20).price(new BigDecimal("79999"))
                .specs("{\"storage\":\"128GB\",\"chip\":\"A16 Bionic\"}")
                .description("Apple iPhone 15").stockQty(30).build());

        System.out.println("✅ Seed data loaded: 1 admin, 1 packer, 1 delivery, 1 customer, 3 products");
    }
}
