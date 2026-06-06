package com.smartdispatch.controller;

import com.smartdispatch.entity.Product;
import com.smartdispatch.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductRepository productRepository;

    @GetMapping
    public List<Product> getAll(@RequestParam(required = false) String search,
                                @RequestParam(required = false) String category) {
        if (search != null && !search.isEmpty()) {
            return productRepository.findByNameContainingIgnoreCaseOrBrandContainingIgnoreCase(search, search);
        }
        if (category != null && !category.isEmpty()) {
            return productRepository.findByCategory(category);
        }
        return productRepository.findByActiveTrue();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getById(@PathVariable UUID id) {
        return productRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/sku/{sku}")
    public ResponseEntity<Product> getBySku(@PathVariable String sku) {
        return productRepository.findBySku(sku)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> create(@RequestBody Map<String, Object> body) {
        Product product = Product.builder()
                .sku((String) body.get("sku"))
                .name((String) body.get("name"))
                .brand((String) body.get("brand"))
                .modelNumber((String) body.getOrDefault("modelNumber", ""))
                .category((String) body.get("category"))
                .color((String) body.getOrDefault("color", ""))
                .weightKg(body.get("weightKg") != null ? ((Number) body.get("weightKg")).doubleValue() : null)
                .weightToleranceG(body.get("weightToleranceG") != null ? ((Number) body.get("weightToleranceG")).intValue() : 100)
                .price(body.get("price") != null ? new BigDecimal(body.get("price").toString()) : null)
                .specs((String) body.getOrDefault("specs", ""))
                .imageUrls((String) body.getOrDefault("imageUrls", ""))
                .description((String) body.getOrDefault("description", ""))
                .stockQty(body.get("stockQty") != null ? ((Number) body.get("stockQty")).intValue() : 0)
                .build();

        return ResponseEntity.ok(productRepository.save(product));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> update(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        return productRepository.findById(id).map(product -> {
            if (body.containsKey("name")) product.setName((String) body.get("name"));
            if (body.containsKey("brand")) product.setBrand((String) body.get("brand"));
            if (body.containsKey("modelNumber")) product.setModelNumber((String) body.get("modelNumber"));
            if (body.containsKey("sku")) product.setSku((String) body.get("sku"));
            if (body.containsKey("category")) product.setCategory((String) body.get("category"));
            if (body.containsKey("color")) product.setColor((String) body.get("color"));
            if (body.containsKey("weightKg")) product.setWeightKg(((Number) body.get("weightKg")).doubleValue());
            if (body.containsKey("weightToleranceG")) product.setWeightToleranceG(((Number) body.get("weightToleranceG")).intValue());
            if (body.containsKey("price")) product.setPrice(new BigDecimal(body.get("price").toString()));
            if (body.containsKey("specs")) product.setSpecs((String) body.get("specs"));
            if (body.containsKey("imageUrls")) product.setImageUrls((String) body.get("imageUrls"));
            if (body.containsKey("description")) product.setDescription((String) body.get("description"));
            if (body.containsKey("stockQty")) product.setStockQty(((Number) body.get("stockQty")).intValue());
            if (body.containsKey("active")) product.setActive((Boolean) body.get("active"));
            return ResponseEntity.ok(productRepository.save(product));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable UUID id) {
        return productRepository.findById(id).map(product -> {
            product.setActive(false);
            productRepository.save(product);
            return ResponseEntity.ok(Map.of("message", "Product deactivated"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
