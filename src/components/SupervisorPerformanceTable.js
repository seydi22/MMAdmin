import React from 'react';
import './SupervisorPerformanceTable.css';

const SupervisorPerformanceTable = ({ data }) => {
    if (!data || data.length === 0) {
        return <p>Aucune donnée de performance à afficher pour le moment.</p>;
    }

    return (
        <div className="performance-table-container">
            <table className="performance-table">
                <thead>
                    <tr>
                        <th>Nom du Superviseur</th>
                        <th>Matricule</th>
                        <th>Nombre de Validations</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item) => (
                        <tr key={item.supervisorId}>
                            <td>{item.supervisorName}</td>
                            <td>{item.supervisorMatricule}</td>
                            <td className="validation-count">{item.validationCount}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SupervisorPerformanceTable;
