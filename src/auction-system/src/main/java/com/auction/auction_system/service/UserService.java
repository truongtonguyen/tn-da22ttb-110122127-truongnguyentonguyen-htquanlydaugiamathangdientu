package com.auction.auction_system.service;

import com.auction.auction_system.dto.UpdateProfileRequest;
import com.auction.auction_system.entity.User;
import com.auction.auction_system.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    // constructor injection (best practice)
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // CREATE
    public User createUser(User user) {
        return userRepository.save(user);
    }

    // READ ALL
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // READ BY ID
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    // UPDATE
    public User updateUser(Long id, User updatedUser) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setUsername(updatedUser.getUsername());
                    user.setEmail(updatedUser.getEmail());
                    user.setPassword(updatedUser.getPassword());
                    return userRepository.save(user);
                })
                .orElseThrow(() -> new RuntimeException("User not found with id " + id));
    }

    // DELETE
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    // BAN USER
    public User banUser(Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setBanned(true);
                    return userRepository.save(user);
                })
                .orElseThrow(() -> new RuntimeException("User not found with id " + id));
    }

    // UNBAN USER
    public User unbanUser(Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    user.setBanned(false);
                    return userRepository.save(user);
                })
                .orElseThrow(() -> new RuntimeException("User not found with id " + id));
    }

    // GET USER COUNT
    public Long getUserCount() {
        return userRepository.count();
    }

    // UPDATE PROFILE
    public User updateProfile(Long id, UpdateProfileRequest request) {
    return userRepository.findById(id)
            .map(user -> {
                if (request.getFullName() != null)
                    user.setFullName(request.getFullName());
                if (request.getPhone() != null)
                    user.setPhone(request.getPhone());
                if (request.getAddress() != null)
                    user.setAddress(request.getAddress());
                return userRepository.save(user);
            })
            .orElseThrow(() -> new RuntimeException("User not found"));
}
}