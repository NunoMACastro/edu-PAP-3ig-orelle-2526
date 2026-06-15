import { Order } from "../models/order.model.js";
import { User } from "../models/user.model.js";

const PAID_PAYMENT_STATUS = "paid";

/**
 * Calcula métricas agregadas para o dashboard administrativo.
 * @returns {Promise<{ orderCount: number, totalSalesCents: number, activeUsers: number, topProducts: Array<object> }>}
 */
export async function getAdminDashboardStats() {
    const [salesSummary] = await Order.aggregate([
        // Só pagamentos confirmados entram em receita.
        { $match: { "payment.status": PAID_PAYMENT_STATUS } },
        {
            $group: {
                _id: null,
                orderCount: { $sum: 1 },
                totalSalesCents: { $sum: "$totalCents" },
            },
        },
    ]);

    const topProducts = await Order.aggregate([
        // O dashboard devolve produtos agregados, nunca clientes individuais.
        { $match: { "payment.status": PAID_PAYMENT_STATUS } },
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.productId",
                name: { $first: "$items.name" },
                unitsSold: { $sum: "$items.quantity" },
                revenueCents: { $sum: "$items.lineTotalCents" },
            },
        },
        { $sort: { unitsSold: -1 } },
        { $limit: 5 },
    ]);

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({ updatedAt: { $gte: since } });

    return {
        orderCount: salesSummary?.orderCount || 0,
        totalSalesCents: salesSummary?.totalSalesCents || 0,
        activeUsers,
        topProducts: topProducts.map((product) => ({
            productId: product._id.toString(),
            name: product.name,
            unitsSold: product.unitsSold,
            revenueCents: product.revenueCents,
        })),
    };
}