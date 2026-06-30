package com.auction.auction_system.repository;

import com.auction.auction_system.entity.User;
import com.auction.auction_system.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    Optional<User> findByResetPasswordToken(String token);

    Optional<User> findByEmailVerificationToken(String token);

    List<User> findByRole(Role role);
}