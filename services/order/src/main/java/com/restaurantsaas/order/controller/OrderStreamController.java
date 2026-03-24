package com.restaurantsaas.order.controller;

import com.restaurantsaas.order.dto.OrderResponse;
import com.restaurantsaas.order.entity.Order;
import com.restaurantsaas.order.service.OrderService;
import com.restaurantsaas.order.service.StoreAccessService;
import com.restaurantsaas.order.util.JwtExtractor;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
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
    private final StoreAccessService storeAccessService;

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<OrderResponse>> streamOrders(
            @PathVariable UUID storeId,
            HttpServletRequest request) {
        var userId = jwtExtractor.extractUserId(request);
        if (userId == null || !storeAccessService.checkAccess(storeId, userId).allowed()) {
            return Flux.just(ServerSentEvent.<OrderResponse>builder()
                    .event("error")
                    .data((OrderResponse) null)
                    .build());
        }

        return Flux.interval(Duration.ofSeconds(2))
                .map(seq -> {
                    try {
                        List<OrderResponse> orders = orderService.getOrdersByStoreAndStatus(
                                storeId, Order.OrderStatus.PENDING, null);
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
