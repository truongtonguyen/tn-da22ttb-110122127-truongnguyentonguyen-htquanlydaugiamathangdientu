package com.auction.auction_system.dto;

public class AdminStatsDTO {
    private Long totalUsers;
    private Long totalAuctions;
    private Long pendingAuctions;
    private Long activeAuctions;
    private Long soldAuctions;
    private Long failedAuctions;
    private Long totalBids;

    public AdminStatsDTO(
            Long totalUsers,
            Long totalAuctions,
            Long pendingAuctions,
            Long activeAuctions,
            Long soldAuctions,
            Long failedAuctions,
            Long totalBids
    ) {
        this.totalUsers = totalUsers;
        this.totalAuctions = totalAuctions;
        this.pendingAuctions = pendingAuctions;
        this.activeAuctions = activeAuctions;
        this.soldAuctions = soldAuctions;
        this.failedAuctions = failedAuctions;
        this.totalBids = totalBids;
    }

    public Long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(Long totalUsers) { this.totalUsers = totalUsers; }

    public Long getTotalAuctions() { return totalAuctions; }
    public void setTotalAuctions(Long totalAuctions) { this.totalAuctions = totalAuctions; }

    public Long getPendingAuctions() { return pendingAuctions; }
    public void setPendingAuctions(Long pendingAuctions) { this.pendingAuctions = pendingAuctions; }

    public Long getActiveAuctions() { return activeAuctions; }
    public void setActiveAuctions(Long activeAuctions) { this.activeAuctions = activeAuctions; }

    public Long getSoldAuctions() { return soldAuctions; }
    public void setSoldAuctions(Long soldAuctions) { this.soldAuctions = soldAuctions; }

    public Long getFailedAuctions() { return failedAuctions; }
    public void setFailedAuctions(Long failedAuctions) { this.failedAuctions = failedAuctions; }

    public Long getTotalBids() { return totalBids; }
    public void setTotalBids(Long totalBids) { this.totalBids = totalBids; }
}
