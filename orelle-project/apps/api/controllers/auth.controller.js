const User = require('../models/user.model.js');
const authService = require('../services/auth.service');

exports.register = async (req, res) => {
try {
    const { email, password } = req.body;

if (!email || !password) {
return res.status(400).json({ error: 'Email e password são obrigatórios.' });
}


if (password.length < 6) {
return res.status(400).json({ error: 'A password deve ter pelo menos 6 caracteres.' });
}


const userExists = await User.findOne({ email });
if (userExists) {
return res.status(409).json({ error: 'Este email já está registado.' });
}


const userCreated = await authService.registerUser(email,password);


// Cenário Positivo: Resposta sem password ou passwordHash
return res.status(201).json({
message: 'Utilizador registado com sucesso.',
user: {
id: userCreated._id,
email: userCreated.email,
role: userCreated.role
}
});

} catch (error) {
console.error('Erro no registo:', error);
return res.status(500).json({ error: 'Erro interno do servidor.' });
}
};