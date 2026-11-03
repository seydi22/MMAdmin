import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../config/apiConfig';
import './Dashboard.css';
import './KycReferentiel.css';

const TAILLES = ['Gros', 'Moyen', 'Petit'];
const emptySecteur = () => ({ nom: '', categories: [{ nom: '', natures: [''] }] });

const KycReferentiel = () => {
  const [secteurs, setSecteurs] = useState([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const headers = () => ({ 'x-auth-token': localStorage.getItem('token') });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/merchants/kyc-referentiel`, { headers: headers() });
        const raw = Array.isArray(res.data.secteurs) ? res.data.secteurs : [];
        setSecteurs(raw.length ? raw : [emptySecteur()]);
        setSelected(0);
      } catch (err) {
        setError(err.response?.data?.msg || 'Impossible de charger le référentiel.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateSecteur = (index, patch) => {
    setSecteurs((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const updateCategorie = (secteurIndex, categorieIndex, patch) => {
    setSecteurs((current) => current.map((secteur, i) => {
      if (i !== secteurIndex) return secteur;
      const categories = secteur.categories.map((categorie, j) => (
        j === categorieIndex ? { ...categorie, ...patch } : categorie
      ));
      return { ...secteur, categories };
    }));
  };

  const removeSecteur = (index) => {
    setSecteurs((current) => {
      const next = current.filter((_, i) => i !== index);
      return next.length ? next : [emptySecteur()];
    });
    setSelected((current) => {
      if (current > index) return current - 1;
      if (current === index) return Math.max(0, index - 1);
      return current;
    });
  };

  const addSecteur = () => {
    setSecteurs((current) => [...current, emptySecteur()]);
    setSelected(secteurs.length);
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    const payload = secteurs.map((secteur) => ({
      nom: secteur.nom,
      categories: (secteur.categories || []).map((categorie) => ({
        nom: categorie.nom,
        natures: (categorie.natures || []).map((nature) => String(nature).trim()).filter(Boolean),
      })),
    }));
    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/merchants/kyc-referentiel`,
        { secteurs: payload },
        { headers: headers() }
      );
      setSecteurs(res.data.secteurs || payload);
      setMessage('Référentiel enregistré. Les prochains enrôlements utilisent ces listes.');
    } catch (err) {
      setError(err.response?.data?.msg || 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-container">Chargement...</div>;

  const index = Math.min(selected, Math.max(secteurs.length - 1, 0));
  const secteur = secteurs[index] || emptySecteur();
  const premiereCategorie = (secteur.categories || []).find((item) => item.nom);
  const premiereNature = premiereCategorie && (premiereCategorie.natures || []).find((item) => String(item).trim());
  const exemple = [secteur.nom, premiereCategorie && premiereCategorie.nom, premiereNature].filter(Boolean).join(' → ');

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content kyc-page">
        <header className="main-header">
          <h1>Référentiel KYC</h1>
        </header>
        <div className="kyc-intro">
          <p>
            L’AAM choisit trois niveaux, dans cet ordre : <strong>secteur</strong>, puis <strong>catégorie</strong>, puis <strong>nature</strong>.
            Seules les combinaisons présentes ici sont acceptées à l’enrôlement.
          </p>
          {exemple && <p className="kyc-example">Exemple sur le téléphone : {exemple}, taille Moyen.</p>}
        </div>
        <div className="kyc-tailles">
          <span>Taille, non modifiable :</span>
          {TAILLES.map((taille) => <em key={taille} className="kyc-pill">{taille}</em>)}
        </div>
        {error && <div className="kyc-alert kyc-alert-error">{error}</div>}
        {message && <div className="kyc-alert kyc-alert-ok">{message}</div>}

        <form onSubmit={save}>
          <div className="kyc-layout">
            <aside className="kyc-nav">
              <h2>Secteurs</h2>
              {secteurs.map((item, secteurIndex) => {
                const count = (item.categories || []).filter((categorie) => categorie.nom).length;
                return (
                  <button
                    key={`nav-${secteurIndex}`}
                    type="button"
                    className={secteurIndex === index ? 'kyc-secteur is-active' : 'kyc-secteur'}
                    onClick={() => setSelected(secteurIndex)}
                  >
                    <span className="kyc-secteur-name">{item.nom || 'Nouveau secteur'}</span>
                    <span className="kyc-secteur-meta">{count} catégorie{count > 1 ? 's' : ''}</span>
                  </button>
                );
              })}
              <button type="button" className="kyc-add" onClick={addSecteur}>Ajouter un secteur</button>
            </aside>

            <section className="kyc-editor">
              <div className="kyc-editor-head">
                <div>
                  <h2>Contenu du secteur</h2>
                  <p className="kyc-path">Secteur → catégorie → nature</p>
                </div>
                <button type="button" className="kyc-quiet" onClick={() => removeSecteur(index)}>Retirer ce secteur</button>
              </div>

              <div className="kyc-field">
                <label htmlFor="kyc-secteur-nom">Nom du secteur</label>
                <input
                  id="kyc-secteur-nom"
                  className="form-control"
                  value={secteur.nom}
                  onChange={(e) => updateSecteur(index, { nom: e.target.value })}
                  required
                />
              </div>

              {(secteur.categories || []).map((categorie, categorieIndex) => (
                <div className="kyc-cat" key={`cat-${index}-${categorieIndex}`}>
                  <div className="kyc-cat-top">
                    <div>
                      <label htmlFor={`kyc-cat-${categorieIndex}`}>Catégorie</label>
                      <input
                        id={`kyc-cat-${categorieIndex}`}
                        className="form-control"
                        value={categorie.nom}
                        onChange={(e) => updateCategorie(index, categorieIndex, { nom: e.target.value })}
                        required
                      />
                    </div>
                    <button
                      type="button"
                      className="kyc-quiet"
                      onClick={() => updateSecteur(index, {
                        categories: (secteur.categories || []).filter((_, i) => i !== categorieIndex),
                      })}
                    >
                      Retirer
                    </button>
                  </div>
                  <label>Natures proposées</label>
                  <div className="kyc-natures">
                    {(categorie.natures || ['']).map((nature, natureIndex) => (
                      <div className="kyc-nature" key={`nature-${categorieIndex}-${natureIndex}`}>
                        <input
                          aria-label={`Nature ${natureIndex + 1}`}
                          value={nature}
                          placeholder="Nature"
                          onChange={(e) => {
                            const natures = [...(categorie.natures || [])];
                            natures[natureIndex] = e.target.value;
                            updateCategorie(index, categorieIndex, { natures });
                          }}
                        />
                        <button
                          type="button"
                          className="kyc-x"
                          aria-label="Retirer la nature"
                          onClick={() => {
                            const natures = (categorie.natures || []).filter((_, i) => i !== natureIndex);
                            updateCategorie(index, categorieIndex, { natures: natures.length ? natures : [''] });
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="kyc-link"
                    onClick={() => updateCategorie(index, categorieIndex, {
                      natures: [...(categorie.natures || []), ''],
                    })}
                  >
                    Ajouter une nature
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="kyc-link"
                onClick={() => updateSecteur(index, {
                  categories: [...(secteur.categories || []), { nom: '', natures: [''] }],
                })}
              >
                Ajouter une catégorie
              </button>
            </section>
          </div>

          <div className="kyc-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer le référentiel'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default KycReferentiel;
