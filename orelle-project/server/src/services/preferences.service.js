import { Preference } from "../models/preference.model.js";

function toPreferenceResponse(preference) {
    return {
        id: preference._id.toString(),
        userId: preference.userId.toString(),
        favoriteBrandNames: preference.favoriteBrandNames,
        favoriteProductIds: preference.favoriteProductIds.map((id) =>
            id.toString(),
        ),
        updatedAt: preference.updatedAt,
    };
}

export async function getMyPreferences(userId) {
    const preference = await Preference.findOneAndUpdate(
        { userId },
        {
            $setOnInsert: {
                userId,
                favoriteBrandNames: [],
                favoriteProductIds: [],
            },
        },
        { upsert: true, new: true },
    );

    return toPreferenceResponse(preference);
}

export async function updateMyPreferences(userId, input) {
    const preference = await Preference.findOneAndUpdate(
        { userId },
        { $set: input },
        { upsert: true, new: true, runValidators: true },
    );

    return toPreferenceResponse(preference);
}