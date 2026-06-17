// apps/api/src/controllers/admin-review.controller.js
import {
    listAdminReviews,
    moderateReview,
} from "../services/admin-review.service.js";
import { validateReviewModerationInput } from "../validators/admin-review.validator.js";

/**
 * Lista reviews para moderação.
 *
 * @async
 * @function listAdminReviewsController
 */
export async function listAdminReviewsController(req, res, next) {
    try {
        const reviews = await listAdminReviews();
        return res.status(200).json({ reviews });
    } catch (err) {
        return next(err);
    }
}

/**
 * Aplica decisão de moderação.
 *
 * @async
 * @function moderateReviewController
 */
export async function moderateReviewController(req, res, next) {
    try {
        const input = validateReviewModerationInput(req.params, req.body);
        const review = await moderateReview({ ...input, adminUserId: req.user.id });
        return res.status(200).json({ review });
    } catch (err) {
        return next(err);
    }
}