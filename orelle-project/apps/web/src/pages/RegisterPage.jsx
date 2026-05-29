import React, { useState } from 'react';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
// ATUALIZADO: Usando o teu link atual do Codespaces para a API na porta 5000
        const response = await fetch('https://reimagined-waffle-976pjgwrjw6ghxgx7-5000.app.github.dev/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {

        setError(data.message || 'Erro ao efetuar o registo.');
    } else {

        setMessage('Utilizador registado com sucesso! ');
        setEmail('');
        setPassword('');
    }
} catch (err) {
    setError('Não foi possível conectar ao servidor do backend.');
} finally {
    setLoading(false);
}
};

return (
    <div style={{ padding: '40px', maxWidth: '400px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'Arial' }}>
        <h2>Criar Conta - Orélle</h2>
        <p style={{ color: '#666', fontSize: '14px' }}>Fase MF0 - Registo de Utilizadores </p>

        {message && <p style={{ color: 'green', fontWeight: 'bold', backgroundColor: '#e6f4ea', padding: '10px', borderRadius: '4px' }}>{message}</p>}
        {error && <p style={{ color: 'red', fontWeight: 'bold', backgroundColor: '#fce8e6', padding: '10px', borderRadius: '4px' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email Académico / Utilizador:</label>
            <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            placeholder="introduza o seu email"
        />
    </div>

    <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password de Acesso:</label>
        <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
            placeholder="mínimo 6 caracteres"
        />
    </div>

    <button
        type="submit"
        disabled={loading}
        style={{ width: '100%', padding: '12px', backgroundColor: loading ? '#9cccfc' : '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
    >
        {loading ? 'A processar...' : 'Finalizar Registo Real'}
        </button>
    </form>
</div>
);
}