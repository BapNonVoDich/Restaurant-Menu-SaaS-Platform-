package com.restaurantsaas.order.repository;

import com.restaurantsaas.order.entity.BillItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BillItemRepository extends JpaRepository<BillItem, UUID> {
    List<BillItem> findByBillId(UUID billId);
}

