package com.restaurantsaas.order.controller;

import com.restaurantsaas.order.dto.OrderResponse;
import com.restaurantsaas.order.entity.Order;
import com.restaurantsaas.order.service.OrderService;
import com.restaurantsaas.order.util.JwtExtractor;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/stores/{storeId}/orders")
@RequiredArgsConstructor
public class OrderStreamController {

    private final OrderService orderService;
    private final JwtExtractor jwtExtractor;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<OrderResponse>> streamOrders(
            @PathVariable UUID storeId,
            HttpServletRequest request) {
        // Validate JWT for authenticated users (optional for public menu, required for staff)
        UUID userId = jwtExtractor.extractUserId(request);
        
        // For now, allow streaming for all (can be restricted later)
        return Flux.interval(Duration.ofSeconds(2))
                .map(seq -> {
                    try {
                        List<OrderResponse> orders = orderService.getOrdersByStoreAndStatus(
                                storeId, Order.OrderStatus.PENDING);
                        return ServerSentEvent.<OrderResponse>builder()
                                .id(String.valueOf(seq))
                                .event("order-update")
                                .data(orders.isEmpty() ? null : orders.get(0))
                                .build();
                    } catch (Exception e) {
                        return ServerSentEvent.<OrderResponse>builder()
                                .event("error")
                                .data((OrderResponse) null)
                                .build();
                    }
                })
                .onErrorResume(error -> {
                    ServerSentEvent<OrderResponse> errorEvent = ServerSentEvent.<OrderResponse>builder()
                            .event("error")
                            .data((OrderResponse) null)
                            .build();
                    return Flux.just(errorEvent);
                });
    }
}
