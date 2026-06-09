import {
    generateRecommendationsForUser,
    listMyRecommendations,
} from "../services/recommendation.service.js";

export async function generateRecommendationsController(req, res, next) {
    try {
        const result = await generateRecommendationsForUser(req.user.id);
        return res.status(201).json(result);
    } catch (err) {
        return next(err);
    }
}

export async function listMyRecommendationsController(req, res, next) {
    try {
        const result = await listMyRecommendations(req.user.id);
        return res.status(200).json(result);
    } catch (err) {
        return next(err);
    }
}