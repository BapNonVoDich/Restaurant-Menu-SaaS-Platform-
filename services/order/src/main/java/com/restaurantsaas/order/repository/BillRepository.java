package com.restaurantsaas.order.repository;

import com.restaurantsaas.order.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Repository
public interface BillRepository extends JpaRepository<Bill, UUID> {
    Optional<Bill> findByOrderId(UUID orderId);
    List<Bill> findByStoreIdOrderByCreatedAtDesc(UUID storeId);

    long countByStoreIdAndStatusAndCompletedAtBetween(
            UUID storeId,
            Bill.BillStatus status,
            LocalDateTime start,
            LocalDateTime end
    );

    @Query("select coalesce(sum(b.totalAmount), 0) from Bill b where b.storeId = :storeId and b.status = :status")
    BigDecimal sumTotalAmountByStoreIdAndStatus(
            @Param("storeId") UUID storeId,
            @Param("status") Bill.BillStatus status
    );

    @Query("select coalesce(sum(b.totalAmount), 0) from Bill b where b.storeId = :storeId and b.status = :status and b.completedAt between :start and :end")
    BigDecimal sumTotalAmountByStoreIdAndStatusAndCompletedAtBetween(
            @Param("storeId") UUID storeId,
            @Param("status") Bill.BillStatus status,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
}

