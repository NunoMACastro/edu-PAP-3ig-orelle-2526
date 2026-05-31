const User = require('../models/user.model.js');
const bcrypt = require('bcrypt');

exports.registerUser = async (email,password) => {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
        email, 
        passwordHash
    });
    return await newUser.save();
};