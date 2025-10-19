
import React, { useState } from '''react''';
import axios from '''axios''';
import { FaEye, FaEyeSlash } from '''react-icons/fa''';
import '''./Settings.css''';
import Sidebar from '''../components/Sidebar''';

const Settings = () => {
    const [oldPassword, setOldPassword] = useState(''');
    const [newPassword, setNewPassword] = useState(''');
    const [confirmPassword, setConfirmPassword] = useState(''');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState(''');
    const [error, setError] = useState(''');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''');
        setError(''');

        if (!oldPassword || !newPassword || !confirmPassword) {
            setError("Tous les champs sont obligatoires.");
            return;
        }

        if (newPassword.length < 6) {
            setError("Le nouveau mot de passe doit comporter au moins 6 caractères.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Les champs “Nouveau mot de passe” et “Confirmer le mot de passe” doivent correspondre.");
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('''token''');
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/api/agents/change-password`,
                {
                    ancienMotDePasse: oldPassword,
                    nouveauMotDePasse: newPassword,
                },
                {
                    headers: {
                        '''Content-Type''': '''application/json''',
                        '''Authorization''': `Bearer ${token}`,
                    },
                }
            );

            if (response.status === 200) {
                setMessage("Mot de passe mis à jour avec succès.");
                setOldPassword(''');
                setNewPassword(''');
                setConfirmPassword(''');
            }
        } catch (err) {
            if (err.response) {
                if (err.response.status === 500) {
                    setError("Erreur du serveur, veuillez réessayer.");
                } else {
                    setError(err.response.data.msg || "Une erreur s'''est produite.");
                }
            } else {
                setError("Erreur de connexion, veuillez vérifier votre réseau.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-page">
            <Sidebar />
            <div className="settings-container">
                <h1>Paramètres</h1>
                <div className="change-password-section">
                    <h2>Changer le mot de passe</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Ancien mot de passe</label>
                            <div className="password-input">
                                <input
                                    type={showOldPassword ? '''text''' : '''password'''}
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                />
                                <span onClick={() => setShowOldPassword(!showOldPassword)} className="password-icon">
                                    {showOldPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Nouveau mot de passe</label>
                            <div className="password-input">
                                <input
                                    type={showNewPassword ? '''text''' : '''password'''}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <span onClick={() => setShowNewPassword(!showNewPassword)} className="password-icon">
                                    {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Confirmer le nouveau mot de passe</label>
                            <div className="password-input">
                                <input
                                    type={showConfirmPassword ? '''text''' : '''password'''}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                <span onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="password-icon">
                                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                        </div>

                        {error && <p className="error-message">{error}</p>}
                        {message && <p className="success-message">{message}</p>}

                        <button type="submit" className="update-btn" disabled={loading}>
                            {loading ? '''Mise à jour...''' : '''Mettre à jour le mot de passe'''}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
