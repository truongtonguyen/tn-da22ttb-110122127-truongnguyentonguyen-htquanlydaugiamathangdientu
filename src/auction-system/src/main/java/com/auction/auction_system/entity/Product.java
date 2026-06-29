package com.auction.auction_system.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private Double startingPrice;

    @ManyToOne
    @JoinColumn(name = "seller_id")
    private User seller;
}
