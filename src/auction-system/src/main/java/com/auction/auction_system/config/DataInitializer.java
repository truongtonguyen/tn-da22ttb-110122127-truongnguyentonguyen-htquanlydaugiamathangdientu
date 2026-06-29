package com.auction.auction_system.config;

import com.auction.auction_system.entity.Category;
import com.auction.auction_system.repository.CategoryRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;

    public DataInitializer(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public void run(String... args) {
        if (categoryRepository.count() == 0) {
            categoryRepository.saveAll(
                    List.of(
                            Category.builder().name("Điện tử").build(),
                            Category.builder().name("Thời trang").build(),
                            Category.builder().name("Đồ gia dụng").build(),
                            Category.builder().name("Sưu tầm - Cổ vật").build(),
                            Category.builder().name("Thể thao & Sở thích").build()
                    )
            );
        }
    }
}
