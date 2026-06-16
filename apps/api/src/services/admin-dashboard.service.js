/**
 * Service do dashboard administrativo da MF3.
 */
import { Order, PAYMENT_STATUS } from "../models/order.model.js";
import { User } from "../models/user.model.js";

/**
 * Calcula estatisticas agregadas para administradores.
 *
 * @async
 * @function getAdminDashboardStats
 * @returns {Promise<{orderCount: number, totalSalesCents: number, activeUsers: number, topProducts: object[]}>} Metricas agregadas.
 */
export async function getAdminDashboardStats() {
    const [salesSummary] = await Order.aggregate([
        { $match: { "payment.status": PAYMENT_STATUS.PAID } },
        {
            $group: {
                _id: null,
                orderCount: { $sum: 1 },
                totalSalesCents: { $sum: "$totalCents" },
            },
        },
    ]);

    const topProducts = await Order.aggregate([
        { $match: { "payment.status": PAYMENT_STATUS.PAID } },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.productId",
                name: { $first: "$items.name" },
                unitsSold: { $sum: "$items.quantity" },
                revenueCents: { $sum: "$items.lineTotalCents" },
            },
        },
        { $sort: { unitsSold: -1, revenueCents: -1 } },
        { $limit: 5 },
    ]);

    const activeSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({
        isActive: true,
        updatedAt: { $gte: activeSince },
    });

    return {
        orderCount: salesSummary?.orderCount ?? 0,
        totalSalesCents: salesSummary?.totalSalesCents ?? 0,
        activeUsers,
        topProducts: topProducts.map((product) => ({
            productId: product._id.toString(),
            name: product.name,
            unitsSold: product.unitsSold,
            revenueCents: product.revenueCents,
        })),
    };
}
